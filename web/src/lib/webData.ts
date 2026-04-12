import { normalizeInviteCode } from "../domain/listRules";
import { pickActiveGroup, type GroupRecord } from "../domain/sessionRules";
import { supabase } from "./supabase";

export interface UserSessionData {
  id: string;
  name: string;
}

export interface ShoppingListRecord {
  id: string;
  ativa: boolean;
  finalizada_em: string | null;
  total: number | null;
  group_id: string;
  items?: Array<{ id: string }>;
}

export interface ItemRecord {
  id: string;
  nome: string;
  quantidade: string;
  categoria: string;
  comprado: boolean;
  preco: number | null;
  criado_por: string | null;
  list_id: string;
}

export interface MemberRecord {
  id: string;
  nome: string;
}

export async function getCurrentUser(): Promise<UserSessionData | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  return {
    id: user.id,
    name: user.user_metadata?.nome ?? user.email ?? "",
  };
}

export async function getSessionUser(): Promise<UserSessionData | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  return {
    id: user.id,
    name: user.user_metadata?.nome ?? user.email ?? "",
  };
}

export async function loadUserGroups(userId: string): Promise<GroupRecord[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, nome, codigo_convite, group_members!inner(user_id)")
    .eq("group_members.user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((group) => ({
    id: group.id,
    nome: group.nome,
    codigo_convite: group.codigo_convite,
  }));
}

export async function restoreGroupContext(
  userId: string,
  savedGroupId: string | null,
) {
  const groups = await loadUserGroups(userId);
  const activeGroup = pickActiveGroup(groups, savedGroupId);

  if (!activeGroup) {
    return { groups: [], group: null, listId: null };
  }

  const { data: listData, error } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("group_id", activeGroup.id)
    .eq("ativa", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    groups,
    group: activeGroup,
    listId: listData?.id ?? null,
  };
}

export async function loadMembers(groupId: string): Promise<MemberRecord[]> {
  const { data: memberData, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (membersError) throw new Error(membersError.message);

  const userIds = (memberData ?? []).map((member) => member.user_id);
  if (userIds.length === 0) return [];

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, nome")
    .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  return (profileData ?? []).map((profile) => ({
    id: profile.id,
    nome: profile.nome ?? "Usuário",
  }));
}

export async function loadActiveList(
  groupId: string,
): Promise<ShoppingListRecord | null> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, ativa, finalizada_em, total, group_id")
    .eq("group_id", groupId)
    .eq("ativa", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function ensureActiveListForGroup(
  groupId: string,
): Promise<ShoppingListRecord> {
  const existing = await loadActiveList(groupId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ group_id: groupId, ativa: true })
    .select("id, ativa, finalizada_em, total, group_id")
    .single();

  if (error) throw new Error(error.message);
  return data as ShoppingListRecord;
}

export async function loadListItems(listId: string): Promise<ItemRecord[]> {
  const { data, error } = await supabase
    .from("items")
    .select(
      "id, nome, quantidade, categoria, comprado, preco, criado_por, list_id",
    )
    .eq("list_id", listId)
    .order("criado_em", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface AddListItemInput {
  listId: string;
  nome: string;
  quantidade: string;
  categoria: string;
  createdBy?: string | null;
}

export async function addListItem(input: AddListItemInput): Promise<void> {
  const { error } = await supabase.from("items").insert({
    list_id: input.listId,
    nome: input.nome,
    quantidade: input.quantidade,
    categoria: input.categoria,
    comprado: false,
    criado_por: input.createdBy ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function toggleListItemPurchased(
  itemId: string,
  purchased: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ comprado: purchased })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function updateListItemPrice(
  itemId: string,
  price: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ preco: price })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function deleteListItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function finishShoppingList(
  listId: string,
  groupId: string,
): Promise<string | null> {
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("preco")
    .eq("list_id", listId);

  if (itemsError) throw new Error(itemsError.message);

  const total = (items ?? []).reduce((sum, item) => sum + (item.preco ?? 0), 0);

  const { error: updateError } = await supabase
    .from("shopping_lists")
    .update({
      ativa: false,
      finalizada_em: new Date().toISOString(),
      total: total > 0 ? total : null,
    })
    .eq("id", listId);

  if (updateError) throw new Error(updateError.message);

  const nextList = await ensureActiveListForGroup(groupId);
  return nextList.id;
}

export async function loadShoppingHistory(
  groupId: string,
): Promise<ShoppingListRecord[]> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, ativa, finalizada_em, total, group_id, items(*)")
    .eq("group_id", groupId)
    .eq("ativa", false)
    .order("finalizada_em", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGroupForCurrentUser(groupName: string): Promise<{
  groupId: string;
  inviteCode: string;
  listId: string | null;
  groupName: string;
}> {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();

  let group: { id: string; nome: string; codigo_convite: string } | null = null;

  const { data: groupId, error: rpcError } = await supabase.rpc(
    "create_group",
    {
      group_name: groupName.trim(),
      invite_code: code,
    },
  );

  if (!rpcError && groupId) {
    const { data: createdGroup, error: groupError } = await supabase
      .from("groups")
      .select("id, nome, codigo_convite")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) throw new Error(groupError.message);
    if (!createdGroup) {
      throw new Error(
        "Grupo criado, mas não visível pelo usuário atual. Verifique policy SELECT em groups.",
      );
    }
    group = createdGroup;
  } else {
    // Fallback for projects that do not have the create_group RPC in schema cache.
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);

    const currentUserId = authData.user?.id;
    if (!currentUserId)
      throw new Error("Usuário não autenticado para criar grupo");

    const { data: insertedGroup, error: insertedGroupError } = await supabase
      .from("groups")
      .insert({ nome: groupName.trim(), codigo_convite: code })
      .select("id, nome, codigo_convite")
      .single();

    if (insertedGroupError) throw new Error(insertedGroupError.message);

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: insertedGroup.id, user_id: currentUserId });

    if (memberError) throw new Error(memberError.message);
    group = insertedGroup;
  }

  if (!group) throw new Error("Não foi possível criar o grupo");

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ group_id: group.id, ativa: true })
    .select("id")
    .single();

  if (listError) throw new Error(listError.message);

  return {
    groupId: group.id,
    inviteCode: code,
    listId: list?.id ?? null,
    groupName: group.nome,
  };
}

export async function joinGroupByCode(
  inviteCode: string,
  userId: string,
): Promise<{
  groupId: string;
  groupName: string;
  inviteCode: string;
  listId: string | null;
}> {
  const normalizedCode = normalizeInviteCode(inviteCode);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, nome, codigo_convite")
    .eq("codigo_convite", normalizedCode)
    .maybeSingle();

  if (groupError) throw new Error(groupError.message);
  if (!group) {
    throw new Error(
      "Grupo não encontrado para este código (ou sem permissão RLS para leitura por código de convite).",
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (!existing) {
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId });

    if (joinError) throw new Error(joinError.message);
  }

  const activeList = await ensureActiveListForGroup(group.id);

  return {
    groupId: group.id,
    groupName: group.nome,
    inviteCode: group.codigo_convite,
    listId: activeList?.id ?? null,
  };
}

export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function createShoppingListForGroup(
  groupId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ group_id: groupId, ativa: true })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
