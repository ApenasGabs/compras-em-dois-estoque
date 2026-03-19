import Toast from "react-native-toast-message";

export function handleError(error: any, fallbackMessage = "Algo deu errado. Tente novamente.") {
    const message = error?.message ?? fallbackMessage;

    const knownErrors: { [key: string]: string } = {
        "Failed to fetch": "Sem conexão com a internet.",
        "JWT expired": "Sessão expirada. Faça login novamente.",
        "invalid claim": "Sessão expirada. Faça login novamente.",
        "Muitas ações": "Muitas ações em pouco tempo. Aguarde.",
        "atingiu o limite de 5 membros": "Grupo cheio. Máximo de 5 membros.",
        "atingiu o limite de 3 grupos": "Limite de 3 grupos atingido.",
        "atingiu o limite de 100 itens": "Limite de 100 itens atingido.",
    };

    const friendlyMessage = Object.entries(knownErrors).find(([key]) =>
        message.includes(key)
    )?.[1] ?? fallbackMessage;

    Toast.show({
        type: "error",
        text1: "Erro",
        text2: friendlyMessage,
        position: "bottom",
        visibilityTime: 3000,
    });
}

export function showSuccess(message: string) {
    Toast.show({
        type: "success",
        text1: message,
        position: "bottom",
        visibilityTime: 2000,
    });
}

export function showInfo(message: string) {
    Toast.show({
        type: "info",
        text1: message,
        position: "bottom",
        visibilityTime: 2000,
    });
}