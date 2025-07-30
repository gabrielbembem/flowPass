import { useNavigate } from "react-router-dom";
import { IPenalty, PenaltyDuration, UserLocalStorage } from "../types";

let showAlertFunction: (message: string, severity: "error" | "success") => void;

export const setAlertFunction = (fn: typeof showAlertFunction) => {
  showAlertFunction = fn;
};

export const showSessionExpiredAlert = () => {
  if (showAlertFunction) {
    showAlertFunction("Sessão expirada - faça login novamente", "error");
  }
};

export const handleCpfChange = (value: string | null | undefined): string => {
  // Se o valor for null ou undefined, substitui por uma string vazia
  value = value || "";

  // Remove todos os caracteres não numéricos
  value = value.replace(/\D/g, "");

  // Limita o CPF a 11 dígitos
  if (value.length > 11) {
    value = value.substring(0, 11);
  }

  // Formata o CPF
  if (value.length <= 3) {
    value = value.replace(/(\d{1,3})/, "$1");
  } else if (value.length <= 6) {
    value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  } else if (value.length <= 9) {
    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  } else {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }

  return value;
};

export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, ""); // Remove não numéricos

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[10])) return false;

  return true;
};

export const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "").slice(0, 11); // Remove caracteres não numéricos e limita a 11 dígitos

  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else {
    return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, "($1) $2 $3-$4");
  }
};

export const calculateEndDate = (penalty: IPenalty): Date => {
  // Mapa para converter a duração da penalidade em dias
  const durationMap = {
    [PenaltyDuration.FifteenDays]: 15,
    [PenaltyDuration.ThirtyDays]: 30,
    [PenaltyDuration.ThreeMonths]: 90,
    [PenaltyDuration.SixMonths]: 180,
  };

  // Calcula a data de término
  const endDate = new Date(penalty.startDate);
  endDate.setDate(endDate.getDate() + durationMap[penalty.duration]);
  return endDate;
};

// Função para recuperar o user do localStorage
export const getUserFromLocalStorage = (): UserLocalStorage | null => {
  const userString = localStorage.getItem("user");
  if (userString) {
    try {
      const user = JSON.parse(userString) as UserLocalStorage; // Faz o parse e tipa como User
      return user;
    } catch (error) {
      console.error("Erro ao fazer parse do user:", error);
      return null;
    }
  }
  return null;
};

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    // 1. Limpa os dados de autenticação
    localStorage.removeItem("token"); // Remove o token do localStorage

    // 2. Redireciona para a rota de login
    navigate("/?expired=true", { replace: true }); // O `replace: true` impede que a página anterior fique no histórico

    // 3. Recarrega a página para garantir que o estado da aplicação seja resetado
    window.location.reload();
  };

  return logout;
};

export function getPriceValue(
  isFree: boolean,
  selectedLot: { value: number | undefined } | null,
  event: {
    basePrice: number | undefined;
    maleBasePrice: number | undefined;
    femaleBasePrice: number | undefined;
  },
  profileData: { gender: string }
): string {
  // Se for gratuito, retorna "0,00"
  if (isFree) {
    return "0,00";
  }

  // Se tiver lote selecionado, retorna o valor do lote (convertido para string formatada)
  if (selectedLot && selectedLot.value !== undefined) {
    return selectedLot.value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Se o preço base do evento for diferente de zero, retorna ele (formatado)
  if (
    event.basePrice &&
    event.basePrice !== 0 &&
    event.basePrice !== undefined
  ) {
    return event.basePrice.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Se não, retorna o preço base de acordo com o gênero (formatado)
  const basePrice =
    profileData.gender === "Masculino"
      ? event.maleBasePrice
      : event.femaleBasePrice;

  return (basePrice ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
