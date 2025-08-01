export interface PhotoUploadResponse {
  success: boolean;
  data?: {
    photoPath: string;
  };
  message: string;
}

export const uploadUserPhoto = async (
  photoBlob: Blob,
  userId: string,
  cpf: string
): Promise<PhotoUploadResponse> => {
  try {
    const fileName = `user_photo_${cpf}_${Date.now()}.jpg`;

    const formData = new FormData();
    formData.append("photo", photoBlob, fileName);
    formData.append("userId", userId);
    formData.append("cpf", cpf);

    const response = await fetch(
      `${process.env.REACT_APP_API_FP_BE}/photos/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      switch (response.status) {
        case 401:
          throw new Error("Sessão expirada. Faça login novamente.");
        case 403:
          throw new Error("Apenas Administradores podem capturar fotos.");
        case 413:
          throw new Error("Arquivo muito grande. Máximo permitido: 5MB.");
        case 415:
          throw new Error(
            "Formato de arquivo não suportado. Apenas JPEG é permitido."
          );
        case 400:
          throw new Error(result.message || "Dados inválidos.");
        case 404:
          throw new Error("Usuário não encontrado.");
        default:
          throw new Error(
            result.message || `Erro ${response.status}: ${response.statusText}`
          );
      }
    }

    return {
      success: true,
      data: result.data,
      message: result.message || "Foto enviada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao salvar a foto.";

    return {
      success: false,
      message: errorMessage,
    };
  }
};

export const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};
