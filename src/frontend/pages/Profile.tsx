/* eslint-disable */
/* prettier-ignore */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  TextField,
  MenuItem,
  TextareaAutosize,
  Modal,
  Snackbar,
  Alert,
  Select,
  SelectChangeEvent,
  CircularProgress,
  ListItemIcon,
  List as MuiList,
  useMediaQuery,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  InputAdornment,
  Avatar,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CloseIcon from "@mui/icons-material/Close";
import {
  createOrUpdateUser,
  getEvents,
  getHistory,
  getLists,
  getUserProfileByCpf,
  updatePromotorCash,
  updateUserInHistory,
  uploadUserPhoto,
  dataURLtoBlob,
} from "../services/index";
import {
  IPenalty,
  IUser,
  PenaltyDuration,
  List,
  History,
  History2,
  IEvent,
} from "../types";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import {
  calculateEndDate,
  formatPhoneNumber,
  getUserFromLocalStorage,
  useLogout,
} from "../utils";
import {
  CalendarMonth,
  GppMaybe,
  Bookmark,
  InsertLink,
  DriveFolderUpload,
} from "@mui/icons-material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { CustomAppBar } from "../components";
import { Types } from "mongoose";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  bgcolor: "background.paper",
  boxShadow: 24,
  padding: "10px",
  borderRadius: "8px",
  overflow: "auto",
  height: "auto",
  minHeight: "200px",
  maxHeight: "600px",
};

const Profile: React.FC = () => {
  const user = getUserFromLocalStorage();
  const [lista, setLista] = useState<List[]>([]);
  const [searchParams] = useSearchParams();
  const cpf = (searchParams.get("cpf") || "").replace(/\D/g, "");

  const allowedProfiles = ["Administrador", "Funcionário", "Mentoria"];
  const canEditPhoto = user?.profile && allowedProfiles.includes(user.profile);

  const [profileData, setProfileData] = useState<IUser>({
    _id: "",
    name: "",
    cpf: cpf,
    birthDate: null,
    phone: "",
    gender: "",
    profile: "",
    anniversary: false,
    histories: [],
    penalties: [],
    currentList: "",
    cash: 0,
    client_id: user?.client_id || "",
  });
  const [newIncident, setNewIncident] = useState("");
  const [errors, setErrors] = useState(
    profileData.name == "" || profileData.gender == ""
  );
  const [openModal, setOpenModal] = useState(false);
  const [suspensionTime, setSuspensionTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const isAmorChurch = user?.client_id === "amorChurch";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const settings = ["Perfil", "Logout"];
  const [activePenalties, setActivePenalties] = useState<boolean>(false);
  const [isFree, setisFree] = useState<boolean>(false);
  const [motivo, setMotivo] = useState<string>("");
  const [isModalOpenTicket, setIsModalOpenTicket] = useState(false);
  const [firstRound, setFirstRound] = useState(false);
  const [secondRound, setSecondRound] = useState(false);
  const [historyId, setHistoryId] = useState<Types.ObjectId | string>("");
  const [userHistories, setUserHistories] = useState<History[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [examScore, setExameScore] = useState<number | null>(0);
  const isAluno = user?.profile === "Aluno";
  const [replacement, setReplacement] = useState([
    {
      link: [
        "https://drive.google.com/uc?export=view&id=1YWFyUBVzDWbVuC6uIpjxmy7N9v-k6tuX",
        "https://drive.google.com/uc?export=view&id=1OtkJPmnHv8IKJGLDfUZhZ3xLjHLAGrKK",
      ],
      title: "Grade Curricular - Módulos",
    },
  ]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [basePrice, setBasePrice] = useState(0);
  const [isComum, setIsComum] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const isPenaltyActive = (penalty: IPenalty): boolean => {
    const today = new Date();
    const endDate = calculateEndDate(penalty);
    return today <= endDate; // Retorna true se a penalidade estiver vigente
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      setSnackbarMessage("Erro ao acessar a câmera. Verifique as permissões.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("camera-video") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedPhoto(photoDataUrl);

      savePhoto(photoDataUrl);

      closeCamera();
    }
  };

  const savePhoto = async (dataUrl: string) => {
    try {
      const photoBlob = dataURLtoBlob(dataUrl);
      const result = await uploadUserPhoto(
        photoBlob,
        profileData._id || "",
        profileData.cpf
      );

      if (result.success && result.data) {
        setProfileData((prev) => ({
          ...prev,
          photoPath: result.data!.photoPath,
          photoUpdatedAt: new Date(),
        }));

        setSnackbarMessage("Foto capturada e salva com sucesso!");
        setSnackbarSeverity("success");
      } else {
        throw new Error(result.message || "Resposta inválida do servidor");
      }
    } catch (error) {
      console.error("Erro ao salvar a foto:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao salvar a foto.";

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const removePhoto = async () => {
    try {
      if (!profileData._id) {
        setSnackbarMessage("ID do usuário não encontrado.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_FP_BE}/photos/${profileData._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 401:
            throw new Error("Sessão expirada. Faça login novamente.");
          case 403:
            throw new Error("Apenas Administradores podem remover fotos.");
          case 404:
            throw new Error("Usuário não encontrado.");
          case 400:
            throw new Error("Usuário não possui foto para remover.");
          default:
            throw new Error(
              result.message ||
                `Erro ${response.status}: ${response.statusText}`
            );
        }
      }

      if (result.success) {
        setCapturedPhoto(null);

        setProfileData((prev) => ({
          ...prev,
          photoPath: undefined,
          photoUpdatedAt: undefined,
        }));

        setSnackbarMessage("Foto removida com sucesso!");
        setSnackbarSeverity("success");
      } else {
        throw new Error(result.message || "Erro ao remover foto");
      }
    } catch (error) {
      console.error("Erro ao remover foto:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao remover a foto.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleAddIncident = () => {
    if (!newIncident || !suspensionTime) {
      alert("Preencha todos os campos do incidente.");
      return;
    }

    const newPenalty: IPenalty = {
      observation: newIncident,
      duration: suspensionTime as PenaltyDuration,
      startDate: new Date().toISOString(),
    };

    setProfileData((prevProfileData) => ({
      ...prevProfileData,
      penalties: [...prevProfileData.penalties, newPenalty],
    }));
    try {
      createOrUpdateUser(profileData);
      setSnackbarMessage("Incidente salvo com sucesso!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setNewIncident("");
      setSuspensionTime("");
    } catch (error) {
      console.error("Erro ao salvar", error);
      setSnackbarMessage("Falha ao salvar Incidente. Tente novamente");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleChange = (field: keyof IUser, value: string | null | Date) => {
    let formattedValue = value;

    if (field === "birthDate" && value instanceof Date) {
      formattedValue = value.toISOString(); // Converte para o formato ISO
    }

    // Atualiza o estado com o valor formatado
    setProfileData({ ...profileData, [field]: formattedValue });
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setIsModalOpenTicket(false);
  };

  const handleSelectList = async (list: any, eventId: any) => {
    setSelectedList(list);
    setHistoryId(list.historico);
    console.log("setHistoryId:", list.historico);
    try {
      setProfileData((prevProfileData) => ({
        ...prevProfileData,
        currentList: list._id || "",
      }));

      setSelectedEvent(eventId);

      handleCloseModal();
    } catch (error) {
      console.error("Erro ao adicionar usuário à lista:", error);
    }
  };

  // const handleRemoveFromList = async () => {
  //   try {
  //     // Verifica se o usuário está em uma lista ativa
  //     if (!isUserInActiveList(profileData, lista)) {
  //       return;
  //           // Obtém o ID da lista atual
  //     const currentListId = profileData.currentList; // Assumindo que o usuário está em apenas uma list      // 2. Remove o usuário da lista no backend
  //     await axios.put(`/histories/${historyId}`, {
  //       userId,
  //       firstRound: false, // ou defina conforme sua lógica
  //       secondRound: false, // ou defina conforme sua lógica
  //       free: false, // ou defina conforme sua lógica
  //       reason: "", // preencha conforme necessário
  //       approver: null // ou defina o ID do aprovador se aplicável
  //     })      // 3. Atualiza o usuário no backend (para limpar currentLists)
  //     await createOrUpdateUser({
  //       ...profileData,
  //       currentLists: [], // Garante que o backend também reflita a remoção
  //     })      // Feedback visual
  //     setSnackbarMessage("Usuário removido da lista com sucesso!");
  //     setSnackbarSeverity("success");
  //     setSnackbarOpen(true);
  //   }
  // } catch (error) {
  //     console.error("Erro ao remover o usuário da lista:", error);
  //     setSnackbarMessage(
  //       "Erro ao remover o usuário da lista. Tente novamente."
  //     );
  //     setSnackbarSeverity("error");
  //     setSnackbarOpen(true);
  //     // };

  const handleSaveUser = async () => {
    try {
      // Certifique-se de obter o ID correto do usuário criado/atualizado
      const updatedUser = await createOrUpdateUser(profileData);
      const userId = updatedUser._id || profileData._id;

      if (!userId) {
        throw new Error("ID do usuário não disponível");
      }

      // Verifique se historyId é válido
      if (historyId) {
        await updateUserInHistory(historyId.toString(), userId.toString(), {
          firstRound,
          secondRound,
          ticket: { paying: isFree, reason: motivo, approver: userId },
          ...(examScore !== undefined && { examScore: Number(examScore) }),
          entrada: new Date(),
        });
      }

      let promotor = selectedList?.owner;
      if (promotor && !isFree) {
        await updatePromotorCash(promotor, 5);
      }

      setSnackbarMessage("Informações do usuário salvas com sucesso!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erro ao salvar/atualizar usuário:", error);

      setSnackbarMessage(
        "Erro ao salvar informações do usuário. Tente novamente."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSuspensionChange = (event: SelectChangeEvent<string>) => {
    setSuspensionTime(event.target.value as string);
  };

  const handleCloseUserMenu = () => {
    useLogout;
    setAnchorElUser(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const isUserInActiveList = (profileData: IUser, lista: List[]) => {
    // Verifica se o usuário não está em nenhuma lista
    if (!profileData.currentList) {
      return false;
    }

    // Filtra as listas ativas (endDate >= data atual)
    const activeLists = lista.filter((list) => {
      const endDate = new Date(list.endDate);
      const today = new Date();
      return endDate >= today;
    });

    // Verifica se o usuário está em alguma lista ativa
    return activeLists.some((list) => list._id === profileData.currentList);
  };

  const logout = useLogout();

  useEffect(() => {
    let isMounted = true; // Flag para controle de montagem

    const fetchData = async () => {
      try {
        if (!cpf) {
          throw new Error("CPF não informado");
        }

        setLoading(true);

        // 1. Busca o perfil do usuário
        const profile = await getUserProfileByCpf(cpf);

        if (!isMounted) return; // Evita atualização se componente desmontou

        if (profile) {
          setProfileData(profile);

          // 2. Definir foto do usuário se existir no photoPath
          if (profile.photoPath) {
            setCapturedPhoto(profile.photoPath);
          } else {
            setCapturedPhoto(null);
          }

          // 3. Busca os históricos em paralelo ou sequencial conforme necessidade
          const histories = await fetchHistories(profile._id || "");

          if (isMounted) {
            // Atualiza estados se componente ainda montado
            setUserHistories(histories);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Limpeza no desmontar do componente
    };
  }, [cpf]);

  useEffect(() => {
    setErrors(
      profileData.name === "" ||
        profileData.gender === "" ||
        profileData.profile === ""
    );
  }, [profileData]);

  useEffect(() => {
    fetchLists();
    fetchEvents();
  }, []);

  const fetchLists = async () => {
    try {
      const data = await getLists();

      // Filtra as listas
      const filteredLists = data.filter((list: List) => {
        const startDate = new Date(list.startDate);
        const today = new Date();

        // Remove o horário das datas para comparar apenas o dia
        const startDateWithoutTime = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        const todayWithoutTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        // Verifica se o domain é igual ao client_id do usuário
        if (list.domain === user?.client_id) {
          // Se o domain for "amorChurch", filtra também por startDate igual a today
          startDateWithoutTime.getTime() === todayWithoutTime.getTime();
          return true;
        }
        // Se o domain não for igual ao client_id do usuário, retorna false
        return false;
      });

      setLista(filteredLists); // Atualiza o estado com as listas filtradas
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
    }
  };

  const fetchHistories = async (userId: string): Promise<History[]> => {
    try {
      const histories = await getHistory();

      // Garante que temos um array válido (ou vazio)
      const safeHistories = Array.isArray(histories) ? histories : [];

      // if (user?.profile === "Mentoria" || user?.profile === "Diretoria") {
      //   return safeHistories.filter((history) => {
      //     // Verificação completa com optional chaining
      //     return history.users?.[0]?.id?.client_id === "amorChurch";
      //   });
      // }

      return safeHistories.filter((history) => {
        return history.users?.some((userHistory) => {
          // Verificação completa do ID
          return userHistory?.id?._id?.toString() === userId;
        });
      });
    } catch (error) {
      console.error("Erro ao filtrar históricos:", error);
      return [];
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      const currentDate = new Date(); // Data atual

      // Filtra apenas eventos com data de fim posterior à data atual
      const activeEvents = data.filter((event: IEvent) =>
        event.endDate ? new Date(event.endDate) > currentDate : false
      );
      setEvents(activeEvents);
    } catch (error) {
      console.error("Erro ao carregar Eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = profileData.penalties.filter((penalty) =>
      isPenaltyActive(penalty)
    );
    setActivePenalties(active.length > 0);
  }, [profileData.penalties]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const getAulaDoDia = (listas: List[]) => {
    const hoje = new Date().toDateString(); // Formato: "Tue May 21 2024"

    return listas.find((lista) => {
      const dataLista = new Date(lista.startDate).toDateString();
      return dataLista === hoje && !lista.isExam; // Adicione `&& !lista.isExam` se quiser excluir exames
    });
  };

  const aulaDoDia = getAulaDoDia(lista);
  const label = aulaDoDia ? aulaDoDia.title : "Sem aula hoje";

  return (
    <div style={{ backgroundColor: "#EDEDED", minHeight: "100vh" }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <CustomAppBar
          isDesktop={isDesktop}
          user={user}
          settings={settings}
          handleOpenUserMenu={handleOpenUserMenu}
          handleCloseUserMenu={handleCloseUserMenu}
          anchorElUser={anchorElUser}
          logout={logout}
        />
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          paddingTop={{ xs: "20px" }}
          flexDirection={{ xs: "column", md: "column" }}
          sx={{
            backgroundColor: "#EDEDED",
          }}
        >
          {loading ? (
            <CircularProgress style={{ color: "#00df81" }} size={64} />
          ) : (
            <>
              {/* Preço dinâmico*/}
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  backgroundColor: "#EDEDED",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Chip dinâmico */}
                {isAmorChurch ? (
                  <Chip
                    icon={<CalendarMonth />}
                    label={label}
                    color={"success"}
                    variant="filled"
                    sx={{
                      width: "100%",
                      "&.MuiChip-iconColor": {
                        color: "red",
                      },
                      justifyContent: "flex-start",
                      color: "white",
                    }}
                    size="medium"
                  />
                ) : (
                  <>
                    {activePenalties ? (
                      <Chip
                        icon={<GppMaybe />}
                        label={"Usuário com suspensão ativa"}
                        color={"error"}
                        variant="filled"
                        sx={{
                          width: "100%",
                          "&.MuiChip-iconColor": {
                            color: "red",
                          },
                          justifyContent: "flex-start",
                          color: "white",
                        }}
                        size="medium"
                      />
                    ) : (
                      <Chip
                        label={
                          profileData.profile == "Promotor"
                            ? `Promotor: ${profileData.name}`
                            : selectedList?.title
                              ? `LISTA: ${selectedList?.title}`
                              : "Adicione o usuário numa lista"
                        }
                        color={
                          profileData.profile == "Promotor" ||
                          selectedList?.title
                            ? "primary"
                            : "warning"
                        }
                        sx={{
                          width: "100%",
                          justifyContent: "center",
                          minWidth: "250px",
                          color: "white",
                        }}
                        size="medium"
                      />
                    )}
                  </>
                )}

                {!activePenalties &&
                profileData.profile !== "Promotor" &&
                !isAmorChurch &&
                !selectedList ? (
                  <IconButton
                    onClick={handleOpenModal}
                    sx={{
                      color: "white",
                      backgroundColor: "#ed6c02",
                      "&:hover": { backgroundColor: "#f3862d" },
                    }}
                    disabled={isComum} // Desabilita o botão se for aluno
                  >
                    <AddIcon />
                  </IconButton>
                ) : // <IconButton
                //   onClick={handleRemoveFromList} // Chama a função para remover da lista
                //   sx={{
                //     gap: "10px",
                //     color: "white",
                //     backgroundColor: "#26d07c",
                //     "&:hover": {
                //       backgroundColor: "#1fa968",
                //     },
                //   }}
                // >
                //   <DeleteIcon />
                // </IconButton>
                null}
                {/* Modal para seleção de lista */}
                <Modal open={openModal} onClose={handleCloseModal}>
                  <Box sx={modalStyle}>
                    <Typography variant="h6" gutterBottom>
                      Selecione uma Lista
                    </Typography>
                    {events.length ? (
                      <MuiList>
                        {events.map((event, index) =>
                          event.lists.map((lista, index) => (
                            <>
                              <ListItem
                                component="li"
                                key={index}
                                onClick={() =>
                                  lista._id &&
                                  handleSelectList(lista, event._id)
                                }
                                sx={{
                                  cursor: "pointer", // Cursor pointer para indicar que é clicável
                                  "&:hover": {
                                    backgroundColor: "#CAFFD2", // Cor de fundo ao passar o mouse
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={lista.title}
                                  secondary={event.title}
                                />
                              </ListItem>
                              <Divider />
                            </>
                          ))
                        )}
                      </MuiList>
                    ) : (
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "grey" }}
                        gutterBottom
                      >
                        Não há listas cadastradas
                      </Typography>
                    )}
                  </Box>
                </Modal>
              </Stack>
              {!isAmorChurch && (
                <Grid
                  container
                  spacing={2}
                  sx={{
                    padding: "20px",
                    marginTop: "20px",
                    alignItems: "center",
                  }}
                  flexDirection={{ xs: "column", md: "row" }}
                >
                  <Grid
                    item
                    xs={12}
                    md={6}
                    display={"flex"}
                    justifyContent={"center"}
                    sx={{ paddingLeft: "16px" }}
                  >
                    <Box sx={{ paddingTop: "16px", paddingLeft: "16px" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isFree}
                            onChange={(event) => {
                              if (!isFree) {
                                setIsModalOpenTicket(true); // Se estava false, abre o modal
                              } else {
                                setisFree(false); // Se estava true, apenas desmarca
                              }
                            }}
                            sx={{
                              "& .MuiSvgIcon-root": { fontSize: 30 },
                            }}
                          />
                        }
                        label="Free"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isComum}
                            onChange={(event) => {
                              setIsComum(!isComum);
                            }}
                            sx={{
                              "& .MuiSvgIcon-root": { fontSize: 30 },
                            }}
                          />
                        }
                        label="Sem Lista"
                        disabled={selectedList !== null}
                      />
                    </Box>
                  </Grid>
                  <Divider />
                  <Grid
                    item
                    xs={12}
                    md={6}
                    flexDirection={"row"}
                    sx={{ marginTop: "20px", maxWidth: "900px" }}
                  >
                    {["Promotor", "Usuário"].includes(profileData.profile) && (
                      <Box
                        sx={{
                          flexDirection: "row",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          gutterBottom
                          sx={{
                            display: "block",
                            color: "#03624c",
                            padding: "5px",
                            fontSize: "13px",
                          }}
                        >
                          {profileData.profile === "Promotor" && "R$"}
                        </Typography>
                        <Typography
                          variant="h5"
                          gutterBottom
                          sx={{ display: "block", color: "#03624c" }}
                        >
                          {profileData.profile === "Promotor" ? (
                            profileData.cash === 0 ? (
                              "0,00"
                            ) : (
                              profileData.cash.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })
                            )
                          ) : (
                            <TextField
                              label="Valor da Entrada"
                              type="number"
                              fullWidth
                              value={
                                isFree
                                  ? 0
                                  : basePrice > 0
                                    ? basePrice
                                    : selectedEvent?.basePrice
                              }
                              onChange={(e) =>
                                setBasePrice(Number(e.target.value))
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    R$
                                  </InputAdornment>
                                ),
                              }}
                              disabled={isFree}
                            />
                          )}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}
              <Container
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  backgroundColor: "#EDEDED",
                }}
              >
                {/* Card de Dados Pessoais */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "900px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Dados Pessoais
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-block",
                      }}
                    >
                      <Avatar
                        src={capturedPhoto || undefined}
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: "2rem",
                          bgcolor: capturedPhoto ? "transparent" : "#26d07c",
                          cursor: canEditPhoto ? "pointer" : "default",
                          border: "3px solid #26d07c",
                          transition: "all 0.3s ease",
                          "&:hover": canEditPhoto
                            ? {
                                opacity: 0.8,
                                transform: "scale(1.05)",
                                boxShadow: "0 4px 20px rgba(38, 208, 124, 0.3)",
                              }
                            : {},
                        }}
                        onClick={canEditPhoto ? openCamera : undefined}
                      >
                        {!capturedPhoto && (
                          <PersonIcon sx={{ fontSize: "3rem" }} />
                        )}
                      </Avatar>

                      {capturedPhoto && canEditPhoto && (
                        <IconButton
                          onClick={removePhoto}
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            backgroundColor: "#f44336",
                            border: "2px solid white",
                            color: "white",
                            width: 35,
                            height: 35,
                            "&:hover": {
                              backgroundColor: "#d32f2f",
                            },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: "1.2rem" }} />
                        </IconButton>
                      )}

                      {canEditPhoto && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            backgroundColor: "#26d07c",
                            borderRadius: "50%",
                            width: 35,
                            height: 35,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            border: "2px solid white",
                            "&:hover": {
                              backgroundColor: "#1fa968",
                            },
                          }}
                          onClick={openCamera}
                        >
                          <CameraAltIcon
                            sx={{ color: "white", fontSize: "1.2rem" }}
                          />
                        </Box>
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        marginTop: "8px",
                        color: "#666",
                        textAlign: "center",
                      }}
                    >
                      {canEditPhoto
                        ? capturedPhoto
                          ? "Clique para alterar a foto"
                          : "Clique para adicionar uma foto"
                        : capturedPhoto
                          ? ""
                          : ""}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nome"
                        value={profileData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleChange("name", e.target.value)
                        }
                        fullWidth
                        error={profileData.name ? false : true}
                        helperText={profileData.name ? "" : "Campo obrigatório"}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="CPF"
                        value={profileData.cpf}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleChange("cpf", e.target.value)
                        }
                        fullWidth
                        disabled
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        sx={{ minWidth: "100%", marginTop: "16px" }}
                        label="Data de Nascimento"
                        value={
                          profileData.birthDate
                            ? new Date(profileData.birthDate) // Converte a string ISO para Date
                            : null // Caso não haja data definida
                        }
                        onChange={
                          (date: Date | null) => handleChange("birthDate", date) // Passa o objeto Date diretamente
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Celular"
                        value={formatPhoneNumber(profileData.phone || "")}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            "phone",
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="(43) 9 9999-9999"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Gênero"
                        value={profileData.gender}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleChange("gender", e.target.value)
                        }
                        fullWidth
                        error={profileData.gender ? false : true}
                        helperText={
                          profileData.gender ? "" : "Campo obrigatório"
                        }
                        margin="normal"
                        disabled={isAluno} // Desabilita o campo se for aluno
                      >
                        <MenuItem value="Feminino">Feminino</MenuItem>
                        <MenuItem value="Masculino">Masculino</MenuItem>
                      </TextField>
                    </Grid>
                    {isAmorChurch ? (
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          label="Perfil"
                          name="profile"
                          value={profileData.profile} // Garante que o valor seja uma string
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleChange("profile", e.target.value)
                          }
                          fullWidth
                          error={!profileData.profile} // Exibe erro se o campo estiver vazio
                          helperText={
                            !profileData.profile ? "Campo obrigatório" : ""
                          } // Mensagem de erro
                          margin="normal"
                          disabled={isAluno} // Desabilita o campo se for aluno
                        >
                          <MenuItem value="Diretoria">Diretoria</MenuItem>
                          <MenuItem value="Mentoria">Mentoria</MenuItem>
                          <MenuItem value="Aluno">Aluno</MenuItem>
                        </TextField>
                      </Grid>
                    ) : (
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          label="Perfil"
                          name="profile"
                          value={profileData.profile} // Garante que o valor seja uma string
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleChange("profile", e.target.value)
                          }
                          fullWidth
                          error={!profileData.profile} // Exibe erro se o campo estiver vazio
                          helperText={
                            !profileData.profile ? "Campo obrigatório" : ""
                          } // Mensagem de erro
                          margin="normal"
                        >
                          {user?.profile === "Administrador" && (
                            <MenuItem value="Promotor">Promotor</MenuItem>
                          )}
                          <MenuItem value="Usuário">Usuário</MenuItem>
                          {user?.profile === "Administrador" && (
                            <MenuItem value="Funcionário">Funcionário</MenuItem>
                          )}
                          {user?.profile === "Administrador" && (
                            <MenuItem value="Administrador">
                              Administrador
                            </MenuItem>
                          )}
                        </TextField>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Card de Histórico de Entradas */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "900px",
                    height: "auto", // altura será controlada por min/max
                    minHeight: "100px",
                    maxHeight: "200px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    marginBottom: "20px",
                    overflow: "auto", // adiciona scroll quando necessário
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Histórico de {isAmorChurch ? "Presença" : "Entradas"}
                  </Typography>
                  <MuiList>
                    {userHistories?.length ? (
                      userHistories
                        .sort(
                          (a, b) =>
                            new Date(b.joinedAt).getTime() -
                            new Date(a.joinedAt).getTime()
                        )
                        .map((history: History, index: number) => {
                          const userEntry = history.users?.find(
                            (user) =>
                              user.id._id?.toString() ===
                              (profileData._id || "")
                          );
                          const isCurrentDay =
                            new Date(history.joinedAt).toDateString() ===
                            new Date().toDateString();
                          return (
                            <>
                              <Grid
                                container
                                spacing={2}
                                key={index}
                                sx={{ mb: 2, marginTop: "5px" }}
                              >
                                <Grid
                                  item
                                  xs={12}
                                  sm={6}
                                  md={4}
                                  sx={{ height: "100%" }}
                                >
                                  <Typography variant="body2" component="div">
                                    {history.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {new Date(
                                      history.listDate ||
                                        new Date().toISOString()
                                    ).toLocaleDateString()}
                                  </Typography>
                                </Grid>

                                {isAmorChurch && (
                                  <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    sx={{ height: "100%" }}
                                  >
                                    <FormGroup sx={{ flexDirection: "row" }}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            icon={<BookmarkBorderIcon />}
                                            checkedIcon={<Bookmark />}
                                            checked={
                                              userEntry?.firstRound === true
                                                ? userEntry?.firstRound
                                                : firstRound
                                            }
                                            onChange={(
                                              event: React.ChangeEvent<HTMLInputElement>
                                            ) => {
                                              setFirstRound(
                                                event.target.checked
                                              );
                                              if (history._id) {
                                                setHistoryId(history._id);
                                              }
                                            }}
                                          />
                                        }
                                        label="1º Turno"
                                        disabled={isAluno || !isCurrentDay}
                                      />
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            icon={<BookmarkBorderIcon />}
                                            checkedIcon={<Bookmark />}
                                            checked={
                                              userEntry?.secondRound === true
                                                ? userEntry?.secondRound
                                                : secondRound
                                            }
                                            onChange={(
                                              event: React.ChangeEvent<HTMLInputElement>
                                            ) => {
                                              setSecondRound(
                                                event.target.checked
                                              );
                                              if (history._id) {
                                                setHistoryId(history._id);
                                              }
                                            }}
                                          />
                                        }
                                        label="2º Turno"
                                        disabled={isAluno || !isCurrentDay}
                                      />
                                    </FormGroup>
                                  </Grid>
                                )}

                                {isAmorChurch && history.isExam && (
                                  <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    sx={{ height: "100%" }}
                                  >
                                    <TextField
                                      fullWidth
                                      id="outlined-number"
                                      label="Nota da Prova"
                                      type="number"
                                      InputLabelProps={{
                                        shrink: true,
                                      }}
                                      value={userEntry?.examScore ?? examScore}
                                      onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>
                                      ) => {
                                        setExameScore(
                                          parseFloat(event.target.value)
                                        );
                                        if (history._id)
                                          setHistoryId(history._id);
                                      }}
                                      disabled={isAluno || !isCurrentDay}
                                    />
                                  </Grid>
                                )}
                              </Grid>
                              <Divider />
                            </>
                          );
                        })
                    ) : (
                      <Typography
                        variant="subtitle1"
                        sx={{ color: "grey" }}
                        gutterBottom
                      >
                        Sem histórico de entradas
                      </Typography>
                    )}
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "grey" }}
                      gutterBottom
                    >
                      Sem histórico de entradas
                    </Typography>
                  </MuiList>
                  <MuiList>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "grey" }}
                      gutterBottom
                    >
                      Sem histórico de entradas
                    </Typography>
                  </MuiList>
                  <MuiList>
                    {profileData.history?.length
                      ? profileData.history
                          .sort(
                            (a, b) =>
                              new Date(b.joinedAt).getTime() -
                              new Date(a.joinedAt).getTime()
                          )
                          .map((history: History2, index: number) => {
                            const isCurrentDay =
                              new Date(history.joinedAt).toDateString() ===
                              new Date().toDateString();
                            return (
                              <>
                                <Grid
                                  container
                                  spacing={2}
                                  key={index}
                                  sx={{ mb: 2, marginTop: "5px" }}
                                >
                                  {/* Bloco 1: Título e Data */}
                                  <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    sx={{ height: "100%" }}
                                  >
                                    <Typography variant="body2" component="div">
                                      {history.name}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {new Date(
                                        history.joinedAt
                                      ).toLocaleDateString()}
                                    </Typography>
                                  </Grid>

                                  {/* Bloco 2: Checkboxes de Turnos (só aparece se isAmorChurch for true) */}
                                  {isAmorChurch && (
                                    <Grid
                                      item
                                      xs={12}
                                      sm={6}
                                      md={4}
                                      sx={{ height: "100%" }}
                                    >
                                      <FormGroup sx={{ flexDirection: "row" }}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              icon={<BookmarkBorderIcon />}
                                              checkedIcon={<Bookmark />}
                                              checked={
                                                history?.firstRound ??
                                                firstRound
                                              }
                                              onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>
                                              ) => {
                                                setFirstRound(
                                                  event.target.checked
                                                );
                                                if (history._id) {
                                                  setHistoryId(history._id);
                                                }
                                              }}
                                            />
                                          }
                                          label="1º Turno"
                                          disabled={isAluno || !isCurrentDay}
                                        />
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              icon={<BookmarkBorderIcon />}
                                              checkedIcon={<Bookmark />}
                                              checked={
                                                history?.secondRound ??
                                                secondRound
                                              }
                                              onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>
                                              ) => {
                                                setSecondRound(
                                                  event.target.checked
                                                );
                                                if (history._id) {
                                                  setHistoryId(history._id);
                                                }
                                              }}
                                            />
                                          }
                                          label="2º Turno"
                                          disabled={isAluno || !isCurrentDay}
                                        />
                                      </FormGroup>
                                    </Grid>
                                  )}

                                  {/* Bloco 3: Campo de Nota (só aparece se for exame) */}
                                  {isAmorChurch && history.isExam && (
                                    <Grid
                                      item
                                      xs={12}
                                      sm={6}
                                      md={4}
                                      sx={{ height: "100%" }}
                                    >
                                      <TextField
                                        fullWidth
                                        id="outlined-number"
                                        label="Nota da Prova"
                                        type="number"
                                        InputLabelProps={{
                                          shrink: true,
                                        }}
                                        value={history?.examScore ?? examScore}
                                        onChange={(
                                          event: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          setExameScore(
                                            parseFloat(event.target.value)
                                          );
                                          if (history._id)
                                            setHistoryId(history._id);
                                        }}
                                        disabled={isAluno || !isCurrentDay}
                                      />
                                    </Grid>
                                  )}
                                </Grid>
                                <Divider />
                              </>
                            );
                          })
                      : null}
                  </MuiList>
                </Box>

                {/* Card de Anexo de material */}
                {isAmorChurch && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: "900px",
                      height: "auto", // altura será controlada por min/max
                      minHeight: "100px",
                      maxHeight: "200px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      boxShadow: 3,
                      padding: "20px",
                      marginBottom: "20px",
                      overflow: "auto", // adiciona scroll quando necessário
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Materiais de reposição
                    </Typography>
                    <MuiList>
                      {replacement?.length &&
                        replacement.map((item, index: number) => {
                          return (
                            <Grid
                              container
                              spacing={2}
                              key={index}
                              sx={{ mb: 2 }}
                            >
                              {/* Bloco 1: Título */}
                              <Grid
                                item
                                xs={12}
                                sm={6}
                                md={4}
                                sx={{ height: "100%" }}
                              >
                                <Typography variant="h6" component="div">
                                  {item.title}
                                </Typography>
                              </Grid>

                              {/* Bloco 2: Botões para cada link */}
                              <Grid
                                item
                                xs={12}
                                sm={6}
                                md={8}
                                sx={{ height: "100%" }}
                              >
                                <Stack direction="row" spacing={2}>
                                  {item.link.map((link, linkIndex) => (
                                    <Button
                                      key={linkIndex}
                                      variant="outlined"
                                      endIcon={<InsertLink />}
                                      onClick={() =>
                                        window.open(link, "_blank")
                                      }
                                      sx={{ textTransform: "none" }}
                                    >
                                      Link {linkIndex + 1}
                                    </Button>
                                  ))}
                                </Stack>
                              </Grid>
                            </Grid>
                          );
                        })}
                    </MuiList>
                  </Box>
                )}

                {/* Card de Envio de Documentos */}
                {isAmorChurch && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: "900px",
                      height: "auto",
                      minHeight: "100px",
                      maxHeight: "300px", // Aumentei um pouco para melhor visualização
                      backgroundColor: "white",
                      borderRadius: "8px",
                      boxShadow: 3,
                      padding: "20px",
                      marginBottom: "20px",
                      overflow: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Enviar Documentos
                    </Typography>

                    {/* Área de Upload */}
                    <Box
                      component="label"
                      htmlFor="file-upload"
                      sx={{
                        border: "2px dashed #ccc",
                        borderRadius: "4px",
                        padding: "20px",
                        textAlign: "center",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <Stack alignItems="center" spacing={2}>
                        <DriveFolderUpload color="primary" fontSize="large" />
                        <Typography variant="body1">
                          Clique para selecionar ou arraste arquivos aqui
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Formatos aceitos: PDF, JPG, PNG)
                        </Typography>
                      </Stack>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            // Aqui você pode armazenar os arquivos no estado
                            const filesArray = Array.from(e.target.files);
                            // setUploadedFiles(filesArray); // Implemente este estado depois
                          }
                        }}
                      />
                    </Box>

                    {/* Lista de arquivos selecionados (aparecerá quando houver arquivos) */}
                    {/* {uploadedFiles?.length > 0 && (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Arquivos selecionados:
      </Typography>
      <List dense>
        {uploadedFiles.map((file, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {file.type.includes('pdf') ? <PictureAsPdfIcon /> : <ImageIcon />}
            </ListItemIcon>
            <ListItemText
              primary={file.name}
              secondary={`${(file.size / 1024).toFixed(2)} KB`}
            />
            <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )} */}
                  </Box>
                )}

                {/* Card de Adicionar Incidentes */}
                {isAmorChurch ? null : (
                  <>
                    {/* Card histórico de Incidentes */}
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: "900px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: 3,
                        padding: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Histórico de incidentes
                      </Typography>
                      <MuiList>
                        {profileData.penalties.length ? (
                          profileData.penalties.map(
                            (entry: IPenalty, index: number) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <ErrorIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <>
                                      Suspenso por{" "}
                                      <strong>{entry.duration}</strong> -
                                      Termina em{" "}
                                      <strong>
                                        {calculateEndDate(
                                          entry
                                        ).toLocaleDateString()}
                                      </strong>
                                    </>
                                  }
                                  secondary={entry.observation}
                                />
                              </ListItem>
                            )
                          )
                        ) : (
                          <Typography
                            variant="subtitle1"
                            sx={{ color: "grey" }}
                            gutterBottom
                          >
                            Sem incidentes
                          </Typography>
                        )}
                      </MuiList>
                    </Box>

                    {/* Card adicionar novo Incidentes */}
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: "900px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: 3,
                        padding: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Adicionar incidentes
                      </Typography>

                      <TextareaAutosize
                        minRows={3}
                        placeholder="Descreva o que aconteceu"
                        value={newIncident}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewIncident(e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "10px",
                        }}
                      />
                      <Box sx={{ marginTop: "20px" }}>
                        <Select
                          value={suspensionTime}
                          onChange={handleSuspensionChange}
                          displayEmpty
                          fullWidth
                          sx={{ marginBottom: "20px" }}
                        >
                          <MenuItem value="" disabled>
                            Tempo de suspensão
                          </MenuItem>
                          {Object.values(PenaltyDuration).map((duration) => (
                            <MenuItem key={duration} value={duration}>
                              {duration}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={handleAddIncident}
                        disabled={!newIncident || !suspensionTime}
                      >
                        Adicionar Incidente
                      </Button>
                    </Box>
                  </>
                )}
                {!isAluno && (
                  <Button
                    variant="contained"
                    disabled={
                      errors ||
                      (!isAmorChurch &&
                        !selectedEvent &&
                        !isFree &&
                        !isComum &&
                        profileData.profile === "Usuário")
                    }
                    sx={{
                      backgroundColor: "#26d07c",
                      marginTop: "20px",
                      "&:hover": {
                        backgroundColor: "#1fa968",
                      },
                    }}
                    onClick={handleSaveUser}
                  >
                    Checkin
                  </Button>
                )}
              </Container>
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000} // Fecha automaticamente após 6 segundos
                onClose={handleCloseSnackbar}
              >
                <Alert
                  variant="filled"
                  onClose={handleCloseSnackbar}
                  severity={snackbarSeverity}
                  sx={{ width: "100%" }}
                >
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </>
          )}
        </Box>

        {/* Modal da Câmera */}
        <Modal open={showCamera} onClose={closeCamera}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 700,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 3,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              "&:focus-visible": {
                outline: "none",
              },
            }}
          >
            <Typography variant="h6" gutterBottom>
              Capturar Foto
            </Typography>

            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: 640,
                height: 480,
                backgroundColor: "#000",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <video
                id="camera-video"
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && stream) {
                    video.srcObject = stream;
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                onClick={capturePhoto}
                variant="contained"
                startIcon={<CameraAltIcon />}
                sx={{
                  backgroundColor: "#26d07c",
                  "&:hover": {
                    backgroundColor: "#1fa968",
                  },
                }}
              >
                Capturar Foto
              </Button>

              <Button
                onClick={closeCamera}
                variant="outlined"
                sx={{
                  borderColor: "#f44336",
                  color: "#f44336",
                  "&:hover": {
                    borderColor: "#d32f2f",
                    backgroundColor: "rgba(244, 67, 54, 0.04)",
                  },
                }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Modal>

        <Modal open={isModalOpenTicket} onClose={handleCloseModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Qual o motivo do Free?
            </Typography>
            <TextField
              label="Motivo"
              multiline
              rows={4}
              variant="outlined"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              fullWidth
            />

            <Button
              onClick={() => {
                handleCloseModal();
                setisFree(true);
              }}
              variant="contained"
              sx={{
                backgroundColor: "#26d07c",
                "&:hover": {
                  backgroundColor: "#1fa968",
                },
              }}
              disabled={!motivo}
            >
              Confirmar
            </Button>
            <Button
              onClick={() => {
                handleCloseModal();
                setMotivo("");
              }}
              variant="contained"
              sx={{
                backgroundColor: "#26d07c",
                "&:hover": {
                  backgroundColor: "#1fa968",
                },
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Modal>
      </LocalizationProvider>
    </div>
  );
};

export default Profile;
