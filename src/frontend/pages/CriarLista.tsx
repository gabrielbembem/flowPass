import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  Tabs,
  Tab,
  Badge,
  Card,
  CardActionArea,
  CardContent,
  CardActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import {
  createEvent,
  createHistory,
  createList,
  getEvents,
  getPromoters,
  getUsers,
  updateEvent,
  updateList,
} from "../services";
import { IEvent, IPromoter, IUser, TabPanelProps } from "../types";
import { getUserFromLocalStorage, useLogout } from "../utils";
import { AlignHorizontalLeft, RecentActors } from "@mui/icons-material";
import { CustomAppBar } from "../components";

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const CriarLista: React.FC = () => {
  const user = getUserFromLocalStorage();
  const [listTitle, setListTitle] = useState("");
  const [listTitleEvent, setListTitleEvent] = useState("");
  const [selectedPromoter, setSelectedPromoter] = useState<IPromoter | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [promoters, setPromoters] = useState<IPromoter[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const isAmorChurch = user?.client_id === "amorChurch";
  const [isExam, setIsExam] = useState(false);
  const [userIds, setUserIds] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [value, setValue] = React.useState(0);
  const settings = ["Perfil", "Logout"];
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const clientId = user?.client_id;
  const [malePrice, setMalePrice] = useState("");
  const [femalePrice, setFemalePrice] = useState("");

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Busca todos os usuários
      const users = await getUsers();

      // Filtra os usuários pelo client_id
      const filteredUsers = users.filter(
        (user: any) => user.profile === "Aluno"
      );

      setUsers(filteredUsers); // Limpa os IDs antes de adicionar novos

      // Extrai os _ids dos usuários filtrados
      const ids = filteredUsers.map((user: any) => user._id);

      // Atualiza o estado com os _ids
      setUserIds(ids);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoters = async () => {
    setLoading(true);
    try {
      const data = await getPromoters();
      setPromoters(data);
    } catch (error) {
      console.error("Erro ao carregar promotores:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();

      // Verifica se user existe antes de filtrar
      const filteredEvents = user
        ? data.filter((event: IEvent) => event.domain === user.client_id)
        : data; // Retorna todos se não houver user

      setEvents(filteredEvents);
    } catch (error) {
      console.error("Erro ao carregar Eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    setLoading(true);
    try {
      // 1. Cria o evento principal
      const newEvent = {
        title: listTitleEvent,
        owner: user?.id || "",
        startDate,
        endDate,
        lists: [],
        listDate: startDate,
        domain: user?.client_id || "",
        basePrice: 25,
        femalePrice: Number(femalePrice),
        malePrice: Number(malePrice),
      };

      const createdEvent = await createEvent(newEvent);

      if (!createdEvent?._id)
        throw new Error("Falha ao criar evento principal");

      // Arrays para armazenar os documentos criados
      const createdHistories = [];
      const createdLists = [];
      const listIdsToAdd = [];

      for (const promoter of promoters) {
        try {
          // 1. Cria a lista PRIMEIRO (agora sem histórico)
          const newList = {
            title: `Lista de ${promoter.name}`,
            owner: promoter._id,
            startDate,
            endDate,
            domain: user?.client_id || "",
            isExam,
            eventId: createdEvent._id,
            historico: null, // Será atualizado depois
          };

          const createdList = await createList(newList);
          if (!createdList?._id) throw new Error("Falha ao criar lista");

          // 2. Cria o histórico COM O listId CORRETO
          const newHistory = {
            listId: createdList._id, // Agora usamos o ID da lista já criada
            name: `Lista de ${promoter.name}`,
            joinedAt: new Date(),
            listDate: startDate,
            isExam,
            eventName: createdEvent.title,
          };

          const createdHistory = await createHistory(newHistory);
          if (!createdHistory?._id) throw new Error("Falha ao criar histórico");

          // 3. Atualiza a lista com o histórico
          await updateList(createdList._id, {
            historico: createdHistory._id.toString(),
          });

          createdLists.push(createdList);
          createdHistories.push(createdHistory);
          listIdsToAdd.push(createdList._id); // Acumula o ID
        } catch (error) {
          console.error(`Erro ao processar promotor ${promoter.name}:`, error);
          throw error;
        }
      }

      const updatedEvent = await updateEvent(createdEvent._id, {
        lists: listIdsToAdd, // Envia todos os IDs de uma vez
      });

      console.log("Evento criado:", createdEvent);
      console.log("Listas criadas:", createdLists);
      console.log("Históricos criados:", createdHistories);

      setSnackbarMessage("Evento criado com sucesso!");
      setSnackbarSeverity("success");
      return {
        event: updatedEvent,
        lists: createdLists,
        histories: createdHistories,
      };
    } catch (error) {
      console.error("Erro ao criar Evento:", error);
      setSnackbarMessage(
        `Erro ao criar Evento: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
      setSnackbarSeverity("error");
      throw error; // Propaga o erro para tratamento externo, se necessário
    } finally {
      setSnackbarOpen(true);
      setLoading(false);
      fetchEvents();
      clearStates();
      fetchEvents();
    }
  };

  useEffect(() => {
    clearStates();
    fetchPromoters();
    fetchEvents();
    fetchUsers();
  }, []);

  const clearStates = () => {
    setListTitle("");
    setListTitleEvent("");
    setSelectedPromoter(null);
    setStartDate(new Date());
    setEndDate(new Date());
    setIsExam(false);
    setMalePrice("");
    setFemalePrice("");
  };

  const handleCreateList = async () => {
    if (clientId === "amorChurch") {
      fetchUsers();
    }

    if (startDate && endDate) {
      const newList = {
        title: listTitle,
        owner: isAmorChurch ? user.id : selectedPromoter?._id || "", // ID do promotor
        startDate: startDate,
        endDate: endDate,
        domain: user?.client_id || "",
        isExam: isExam,
        eventId: selectedEvent?._id || "",
        eventName: selectedEvent?.title || "",
      };

      try {
        // Cria a lista e obtém o ID da lista criada
        const createdList = await createList(newList);

        const newHistory = {
          listId: createdList._id, // Usa o ID da lista recém-criada
          name: listTitle, // Usa o mesmo título da lista ou pode ser personalizado
          joinedAt: new Date(), // Data atual como default
          listDate: selectedEvent?.startDate ?? new Date(), // Data atual como default
          users: userIds.map((userId) => ({
            // Mapeia os userIds para o formato do schema
            id: userId,
            firstRound: false, // Default false
            examScore: 0, // Default 0
            secondRound: false, // Default false
            ticket: {
              paying: false, // Default false
              reason: "",
              approver: null,
            },
            entrada: new Date(), // Default null
          })),
          isExam: isExam, // Mesmo valor da lista
          eventName: selectedEvent?.title || "", // Nome do evento, se disponível
        };

        const createdHistory = await createHistory(newHistory);

        if (!createdHistory || !createdHistory._id) {
          throw new Error("Falha ao criar histórico");
        }
        console.log("createdHistory", createdHistory);
        const updatedList = await updateList(createdList._id ?? "", {
          ...createdList,
          historico: createdHistory._id,
        });
        if (!updatedList) {
          throw new Error("Falha ao atualizar a lista com o histórico");
        }
        console.log("updatedList", updatedList);

        // Atualiza o evento com o ID da nova lista
        if (selectedEvent?._id && createdList?._id) {
          const updatedEvent = await updateEvent(selectedEvent._id, {
            ...selectedEvent,
            lists: [...selectedEvent.lists, updatedList._id],
          });

          if (!updatedEvent) {
            throw new Error("Falha ao atualizar o evento com a nova lista");
          }
        }
        setSnackbarMessage("Lista criada com sucesso!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        clearStates();
        fetchEvents();
      } catch (error) {
        console.error("Erro ao criar lista:", error);
        setSnackbarMessage("Erro ao criar lista. Tente novamente.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } else {
      console.error("Datas de início e fim são obrigatórias.");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logout = useLogout();

  return (
    <div
      style={{
        backgroundColor: "#EDEDED",
        minHeight: "100vh",
      }}
    >
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

        {/* Container */}
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab
            label="Criar"
            {...a11yProps(0)}
            sx={{ width: "50%", maxWidth: "50%" }}
          />
          <Tab
            label="Relatórios"
            {...a11yProps(1)}
            sx={{ width: "50%", maxWidth: "50%" }}
          />
        </Tabs>
        <CustomTabPanel value={value} index={0}>
          <Box
            width="100%"
            display="flex"
            marginTop={{ xs: "0px", md: "30px" }}
            alignItems="center"
            justifyContent="center"
            flexDirection={{ xs: "column", md: "column" }}
            sx={{
              backgroundColor: "#EDEDED",
            }}
          >
            {loading ? (
              <CircularProgress sx={{ alignItems: "center" }} />
            ) : (
              <>
                {/* Criar Novo Evento */}
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    margin: "20px",
                    width: "100%",
                    maxWidth: "900px",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Novo Evento
                  </Typography>
                  <Box>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Grid
                        item
                        display={"flex"}
                        sx={{
                          display: "flex",
                          flexGrow: 1,
                          flexDirection: isDesktop ? "row" : "column",
                        }}
                      >
                        {/* Título do Evento */}
                        <TextField
                          label="Título do Evento"
                          fullWidth
                          value={listTitleEvent}
                          onChange={(e) => setListTitleEvent(e.target.value)}
                          sx={{
                            marginBottom: "20px",
                            flex: "none",
                            flexShrink: 1,
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Date Pickers para Início e Fim */}
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Data de Início"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          sx={{ marginBottom: "20px", width: "100%" }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Data de Fim"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          sx={{ marginBottom: "20px", width: "100%" }}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      disabled={!listTitleEvent || !startDate || !endDate}
                      variant="contained"
                      sx={{
                        backgroundColor: "#26d07c",
                        "&:hover": {
                          backgroundColor: "#1fa968",
                        },
                        height: "54px",
                        display: "flex",
                        justifySelf: "stretch",
                      }}
                      onClick={handleCreateEvent}
                    >
                      Criar Evento
                    </Button>
                  </Box>
                </Box>

                {/* Criar Nova Lista */}
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    margin: "20px",
                    width: "100%",
                    maxWidth: "900px",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Nova {isAmorChurch ? "Aula" : "Lista"}
                  </Typography>
                  <Box>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Grid item xs={12} md={6}>
                        {/* Select de Eventos */}
                        <Select
                          value={selectedEvent?._id || ""}
                          onChange={(e) => {
                            const selectedEvent =
                              events.find(
                                (event) => event._id === e.target.value
                              ) || null;
                            setSelectedEvent(selectedEvent);
                          }}
                          displayEmpty
                          fullWidth
                          sx={{ marginBottom: "20px" }}
                        >
                          <MenuItem value="" disabled sx={{ color: "gray" }}>
                            Selecione um Evento
                          </MenuItem>
                          {events.length > 0 ? (
                            events.map((event) => (
                              <MenuItem key={event._id} value={event._id}>
                                {event.title}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem>Nenhum evento cadastrado</MenuItem>
                          )}
                        </Select>
                      </Grid>
                      <Grid
                        item
                        display={"flex"}
                        sx={{
                          display: "flex",
                          flexGrow: 1,
                          flexDirection: isDesktop ? "row" : "column",
                        }}
                      >
                        {/* Título da Lista */}
                        <TextField
                          label="Título da Lista"
                          fullWidth
                          value={listTitle}
                          onChange={(e) => setListTitle(e.target.value)}
                          sx={{
                            marginBottom: "20px",
                            flex: "none",
                            flexShrink: 1,
                          }}
                        />
                        {isAmorChurch && (
                          <FormControlLabel
                            sx={{ marginInline: "20px", marginBottom: "20px" }}
                            control={
                              <Checkbox
                                checked={isExam}
                                onChange={(
                                  event: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  setIsExam(event.target.checked);
                                }}
                                sx={{ "& .MuiSvgIcon-root": { fontSize: 30 } }}
                              />
                            }
                            label="Nesta aula terá prova."
                          />
                        )}
                      </Grid>
                      {!isAmorChurch && (
                        <Grid item xs={12} md={12}>
                          {/* Select de Promotores */}
                          <Select
                            value={selectedPromoter?._id || "Sem Promotor"} // Usa o ID do promotor ou uma string vazia
                            onChange={(e) => {
                              if (e.target.value === "semPromotor") {
                                setSelectedPromoter(null); // Abre o modal se a opção for "Cadastrar novo promotor"
                              } else {
                                const selectedPromoterId = e.target.value;
                                const promoter =
                                  promoters.find(
                                    (p) => p._id === selectedPromoterId
                                  ) || null;
                                setSelectedPromoter(promoter); // Seleciona o promotor
                              }
                            }}
                            displayEmpty
                            fullWidth
                            sx={{ marginBottom: "20px" }}
                          >
                            <MenuItem value="" disabled sx={{ color: "gray" }}>
                              Selecione um Promotor
                            </MenuItem>
                            <MenuItem
                              value="semPromotor"
                              sx={{ color: "orange", backgroundColor: "linen" }}
                            >
                              Sem promotor
                            </MenuItem>
                            {promoters.map((promoter) => (
                              <MenuItem key={promoter._id} value={promoter._id}>
                                {promoter.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </Grid>
                      )}
                    </Grid>
                    {isAmorChurch ? (
                      <Button
                        disabled={!(listTitle && startDate && endDate)}
                        variant="contained"
                        sx={{
                          backgroundColor: "#26d07c",
                          "&:hover": {
                            backgroundColor: "#1fa968",
                          },
                          display: "flex",
                          justifySelf: "stretch",
                        }}
                        onClick={handleCreateList}
                      >
                        Criar Aula
                      </Button>
                    ) : (
                      <Button
                        disabled={
                          !(
                            listTitle &&
                            selectedPromoter &&
                            startDate &&
                            endDate
                          )
                        }
                        variant="contained"
                        sx={{
                          backgroundColor: "#26d07c",
                          "&:hover": {
                            backgroundColor: "#1fa968",
                          },
                          display: "flex",
                          justifySelf: "stretch",
                        }}
                        onClick={handleCreateList}
                      >
                        Criar Lista
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={5000} // Fecha automaticamente após 6 segundos
              onClose={handleCloseSnackbar}
            >
              <Alert
                onClose={handleCloseSnackbar}
                severity={snackbarSeverity}
                sx={{ width: "100%" }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </Box>
        </CustomTabPanel>

        {/* Dados dos eventos */}
        <CustomTabPanel value={value} index={1}>
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            marginTop={{ xs: "0px", md: "30px" }}
            flexDirection={{ xs: "column", md: "column" }}
            sx={{
              backgroundColor: "#EDEDED",
            }}
          >
            {loading ? (
              <CircularProgress sx={{ alignItems: "center" }} />
            ) : (
              <>
                {/*Box de Eventos*/}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "900px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    margin: "20px",
                    minHeight: "100px",
                    maxHeight: "400px",
                    height: "auto",
                    overflow: "auto",
                  }}
                >
                  {/* Segundo Box: Listas dos Promotores */}
                  <Typography variant="h6" gutterBottom>
                    {isAmorChurch ? "Módulos" : "Eventos"}
                  </Typography>

                  {/* Lista de Acordeões */}
                  {events?.length ? (
                    <>
                      {events.map((event, index) => {
                        return (
                          <Accordion
                            key={index}
                            sx={{
                              backgroundColor: "#a8ddbd",
                              "&.Mui-expanded": { backgroundColor: "#caffd2" },
                              marginBottom: "10px",
                              borderBottom: "1px",
                              borderBottomColor: "#caffd2",
                              alignItems: "center",
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{ alignItems: { xs: "center" } }}
                            >
                              <Typography>
                                {event.title}{" "}
                                {isAmorChurch
                                  ? ""
                                  : event.owner
                                    ? `- Autor: ${event.owner.name}`
                                    : null}{" "}
                                - de{" "}
                                {event.startDate
                                  ? new Date(
                                      event.startDate
                                    ).toLocaleDateString()
                                  : "--"}
                                {
                                  <Badge
                                    badgeContent={event.lists.length}
                                    color="primary"
                                    sx={{ margin: "10px" }}
                                  >
                                    <RecentActors color="action" />
                                  </Badge>
                                }
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails
                              sx={{ backgroundColor: "#f0f0f0" }}
                            >
                              {event.lists?.length > 0 ? (
                                event.lists.map((list) => (
                                  <Accordion
                                    key={list._id}
                                    sx={{
                                      backgroundColor: "#d1ffe6",
                                      "&.Mui-expanded": {
                                        backgroundColor: "#d4eede",
                                      },
                                      marginBottom: "10px",
                                      borderBottom: "1px",
                                      borderBottomColor: "#d4eede",
                                      alignItems: "center",
                                    }}
                                  >
                                    <AccordionSummary
                                      expandIcon={<ExpandMoreIcon />}
                                      sx={{ alignItems: { xs: "center" } }}
                                    >
                                      <Typography>
                                        {list.title}{" "}
                                        {isAmorChurch
                                          ? ""
                                          : `- Autor: ${list.owner?.name}`}{" "}
                                        - de{" "}
                                        {list.startDate
                                          ? new Date(
                                              list.startDate
                                            ).toLocaleDateString()
                                          : "--"}
                                        {list.endDate
                                          ? ` a ${new Date(list.endDate).toLocaleDateString()}`
                                          : "--"}
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails
                                      sx={{ backgroundColor: "#f0f0f0" }}
                                    >
                                      <List>
                                        {!isAmorChurch ? (
                                          <Button
                                            onClick={() => {}}
                                            startIcon={<AlignHorizontalLeft />}
                                            variant="contained"
                                            sx={{
                                              marginLeft: "auto",
                                              maxHeight: "fit-content",
                                              width: "100%",
                                            }}
                                            disabled // Desabilita o botão se a lista estiver fechada
                                          >
                                            {list.historico?.users?.length}{" "}
                                            Usuários
                                          </Button>
                                        ) : (
                                          <Button
                                            onClick={() => {}}
                                            startIcon={<AlignHorizontalLeft />}
                                            variant="contained"
                                            sx={{
                                              marginLeft: "auto",
                                              maxHeight: "fit-content",
                                              width: "100%",
                                              backgroundColor: "#d0267a",
                                              color: "white",
                                            }}
                                            disabled // Desabilita o botão se a lista estiver fechada
                                          >
                                            {list.historico?.users?.length}{" "}
                                            Pessoas{" "}
                                            {list.isExam ? " - Prova" : ""}
                                          </Button>
                                        )}
                                        {(list.historico?.users?.length ??
                                        0 > 0) ? (
                                          list.historico?.users?.map(
                                            (user, index) => {
                                              return (
                                                <ListItem key={index}>
                                                  <ListItemText
                                                    primary={user.id.name}
                                                    secondary={
                                                      isAmorChurch
                                                        ? `${
                                                            user.firstRound ||
                                                            user.secondRound
                                                              ? user.firstRound &&
                                                                user.secondRound
                                                                ? "100%"
                                                                : "50%"
                                                              : "0%"
                                                          } de presença`
                                                        : user.ticket.paying
                                                          ? "Pagante"
                                                          : "Free"
                                                    }
                                                    sx={{
                                                      // Estilos para o texto primário (nome do aluno)
                                                      "& .MuiListItemText-primary":
                                                        {
                                                          maxWidth: "100%", // Default (desktop)
                                                          "@media (max-width: 600px)":
                                                            {
                                                              // Aplica apenas em mobile
                                                              maxWidth: "70%",
                                                              overflow:
                                                                "hidden",
                                                              textOverflow:
                                                                "ellipsis",
                                                              whiteSpace:
                                                                "nowrap",
                                                            },
                                                        },
                                                      // Estilos para o texto secundário (status)
                                                      "& .MuiListItemText-secondary":
                                                        {
                                                          // Adicione estilos personalizados se necessário
                                                        },
                                                    }}
                                                  />
                                                  {list.isExam && (
                                                    <ListItemText
                                                      sx={{
                                                        color:
                                                          user.examScore > 50
                                                            ? "green"
                                                            : "red",
                                                        textAlign: "end",
                                                      }}
                                                    >
                                                      Nota {user.examScore}
                                                    </ListItemText>
                                                  )}
                                                </ListItem>
                                              );
                                            }
                                          )
                                        ) : (
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ color: "gray" }}
                                          >
                                            A lista está vazia
                                          </Typography>
                                        )}
                                      </List>
                                    </AccordionDetails>
                                  </Accordion>
                                ))
                              ) : (
                                <Typography
                                  variant="subtitle2"
                                  sx={{ color: "gray" }}
                                >
                                  Nenhuma lista cadastrada
                                </Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </>
                  ) : (
                    <Typography variant="subtitle2" sx={{ color: "gray" }}>
                      Nenhum evento cadastrado
                    </Typography>
                  )}
                </Box>
                {/*Box de Promotores e Alunos*/}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "900px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: 3,
                    padding: "20px",
                    margin: "20px",
                    minHeight: "100px",
                    maxHeight: "400px",
                    height: "auto",
                    overflow: "auto",
                  }}
                >
                  {/* Segundo Box: Listas dos Promotores */}
                  <Typography variant="h6" gutterBottom>
                    {isAmorChurch ? "Alunos" : "Promotores"}
                  </Typography>

                  {/* Lista de Promotores */}
                  {promoters?.length
                    ? promoters.map((promotor, index) => {
                        return (
                          <Accordion
                            key={index}
                            sx={{
                              backgroundColor: "#a8ddbd",
                              "&.Mui-expanded": { backgroundColor: "#caffd2" },
                              marginBottom: "10px",
                              borderBottom: "1px",
                              borderBottomColor: "#caffd2",
                              alignItems: "center",
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{ alignItems: { xs: "center" } }}
                            >
                              <Typography>{promotor.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails
                              sx={{
                                backgroundColor: "#f0f0f0",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <Card sx={{ flexGrow: 1, marginInline: "10px" }}>
                                <CardContent sx={{ height: "100%" }}>
                                  <Typography variant="h5" component="div">
                                    CPF:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {promotor.cpf || "Não informado"}
                                  </Typography>
                                </CardContent>
                              </Card>
                              <Card sx={{ flexGrow: 1, marginInline: "10px" }}>
                                <CardContent sx={{ height: "100%" }}>
                                  <Typography variant="h5" component="div">
                                    Telefone:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {promotor.phone || "Não informado"}
                                  </Typography>
                                </CardContent>
                              </Card>
                              <Card sx={{ flexGrow: 1, marginInline: "10px" }}>
                                <CardContent sx={{ height: "100%" }}>
                                  <Typography variant="h5" component="div">
                                    Comissão:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    R$ {promotor.cash || "Não informado"}
                                  </Typography>
                                </CardContent>
                                <CardActions>
                                  <Button
                                    size="small"
                                    onClick={() => {
                                      alert("Comissão quitada com sucesso!");
                                    }}
                                  >
                                    Quitar
                                  </Button>
                                </CardActions>
                              </Card>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })
                    : null}
                  {/* Lista de Alunos */}
                  {users?.length
                    ? users.map((user, index) => {
                        return (
                          <Accordion
                            key={index}
                            sx={{
                              backgroundColor: "#a8ddbd",
                              "&.Mui-expanded": { backgroundColor: "#caffd2" },
                              marginBottom: "10px",
                              borderBottom: "1px",
                              borderBottomColor: "#caffd2",
                              alignItems: "center",
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{ alignItems: { xs: "center" } }}
                            >
                              <Typography>{user.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails
                              sx={{ backgroundColor: "#f0f0f0" }}
                            ></AccordionDetails>
                          </Accordion>
                        );
                      })
                    : null}
                </Box>
              </>
            )}
          </Box>
        </CustomTabPanel>
      </LocalizationProvider>
    </div>
  );
};

export default CriarLista;
