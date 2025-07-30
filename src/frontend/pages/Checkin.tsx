/* eslint-disable */
/* prettier-ignore */

import React, { forwardRef, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Slide,
  SlideProps,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getUserFromLocalStorage,
  handleCpfChange,
  useLogout,
  validateCPF,
} from "../utils";
import { QrCodeReader } from "../components";
import QrCodeIcon from "@mui/icons-material/QrCode";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Close as CloseIcon, CropFree } from "@mui/icons-material";
import { fetchQRCode } from "../services";
import { CustomAppBar } from "../components/index";

const Checkin: React.FC = () => {
  const [cpf, setCpf] = useState<string>("");
  const [QRcodeCpf, setQRcodeCpf] = useState<string>("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [qrCodeLink, setQrCodeLink] = useState<string>(""); // State for QR code link
  const [qrCodeLinkImage, setQrCodeLinkImage] = useState<string>(""); // State for QR code link
  const user = getUserFromLocalStorage();
  const settings = ["Perfil", "Logout"];
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const [showScanner, setShowScanner] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isAmorChurch = user?.client_id === "amorChurch";
  const isauthorized = user
    ? ["Diretoria", "Mentoria", "Administrador"].includes(user.profile)
    : false;
  const isAluno = user?.profile === "Aluno";

  const handleLista = () => {
    navigate("/CriarLista");
  };

  const Transition = forwardRef<HTMLDivElement, SlideProps>(function Transition(
    props: SlideProps,
    ref: React.Ref<HTMLDivElement>
  ) {
    return (
      <Slide direction="up" ref={ref} {...props}>
        {props.children}
      </Slide>
    );
  });

  const editaCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(handleCpfChange(e.target.value));
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logout = useLogout();

  const generateQRcode = async () => {
    const isValid = validateCPF(cpf);
    setError(!isValid);
    if (!isValid) return;
    try {
      const response = await fetchQRCode(cpf);
      setQRcodeCpf(response?.qrCode); // Data URL da imagem do QR code
      setQrCodeLinkImage(response?.qrCodeLink); // Link armazenado no MongoDB
    } catch (error) {
      console.error("Erro ao buscar QR code:", error);
    }
  };

  const handleCheck = () => {
    const isValid = validateCPF(cpf);
    setError(!isValid);
    if (isValid) {
      navigate(`/profile?cpf=${cpf}`);
    }
  };

  const handleToProfile = () => {
    navigate(`/profile?cpf=${user?.cpf}`);
  };

  useEffect(() => {
    if (qrCodeLink) navigate(`/profile?cpf=${qrCodeLink}`);
  }, [qrCodeLink]);

  return (
    <>
      {/* Barra superior */}
      <CustomAppBar
        isDesktop={isDesktop}
        user={user}
        settings={settings}
        handleOpenUserMenu={handleOpenUserMenu}
        handleCloseUserMenu={handleCloseUserMenu}
        anchorElUser={anchorElUser}
        logout={logout}
        handleToProfile={handleToProfile}
      />

      {/* Corpo */}
      <Container
        sx={{
          display: { xs: "block", sm: "flex" },
          justifyContent: "center",
          height: "calc(100vh - 65px)",
          padding: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Coluna 1: Typography */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              gutterBottom
              textAlign={{ xs: "center", md: "center" }}
              fontSize={{ xs: "1.5rem", sm: "2.5rem", md: "2.5rem" }}
              marginTop={{ xs: "50px" }}
            >
              {isAmorChurch
                ? user.profile === "Aluno"
                  ? `Olá ${user?.name.split(" ")[0]} 💎`
                  : "Entre com as credenciais para confirmar presença"
                : "Digite o CPF para fazer o check-in"}
            </Typography>
          </Grid>

          {/* Coluna 2: Box com campo de CPF e botão */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: { xs: "100%", md: "70%" },
                border: "1px solid lightgray", // Borda cinza claro
                borderRadius: "8px", // Cantos arredondados
                padding: "32px", // Espaçamento interno
              }}
            >
              {!isAluno && (
                <TextField
                  label="Insira um CPF"
                  variant="outlined"
                  fullWidth
                  value={cpf}
                  onChange={editaCpf}
                  error={error}
                  helperText={error ? "CPF inválido ou não encontrado." : ""}
                />
              )}
              <Grid
                container
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Grid width={"100%"}>
                  {!isAluno && (
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#26d07c",
                        marginTop: "20px",
                        "&:hover": { backgroundColor: "#1fa968" },
                        width: "100%", // Botão com largura total
                        alignSelf: "flex-start",
                      }}
                      disabled={cpf.length !== 14 || loading}
                      onClick={handleCheck}
                    >
                      {loading ? "Verificando..." : "Checar"}
                    </Button>
                  )}
                  {isAluno && (
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#26d07c",
                        marginTop: "20px",
                        "&:hover": { backgroundColor: "#1fa968" },
                        width: "100%", // Botão com largura total
                        alignSelf: "flex-start",
                      }}
                      onClick={handleToProfile}
                    >
                      {loading ? (
                        <CircularProgress
                          sx={{
                            color: "white",
                          }}
                          size={24}
                        />
                      ) : (
                        "ir para Perfil"
                      )}
                    </Button>
                  )}
                </Grid>
                {isauthorized && (
                  <Grid width={"100%"}>
                    <Button
                      variant="text"
                      sx={{
                        marginTop: "20px",
                        "&:hover": { backgroundColor: "#caffd2" },
                        width: "100%", // Botão com largura total
                        alignSelf: "flex-start",
                        color: "#021b1a",
                      }}
                      onClick={handleLista}
                    >
                      {isAmorChurch ? "Gerenciar aulas" : "Gerenciar listas"}
                    </Button>
                  </Grid>
                )}
                {/* GeraR QR Code */}
                {/* <Grid width={"100%"}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#26d07c",
                      marginTop: "20px",
                      "&:hover": { backgroundColor: "#1fa968" },
                      width: "100%", // Botão com largura total
                      alignSelf: "flex-start",
                    }}
                    onClick={() => generateQRcode()}
                    startIcon={<CropFree />}
                  >
                    Gerar QR Code
                  </Button>
                </Grid> */}
                {!isDesktop && isAmorChurch && (
                  <>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#26d07c",
                        marginTop: "20px",
                        "&:hover": { backgroundColor: "#1fa968" },
                        width: "100%",
                      }}
                      onClick={() => setShowScanner(true)}
                      startIcon={<QrCodeIcon />}
                    >
                      Ler QR Code
                    </Button>

                    <Dialog
                      fullScreen
                      open={showScanner}
                      onClose={() => setShowScanner(false)}
                      TransitionComponent={Transition}
                      PaperProps={{
                        style: {
                          backgroundColor: "black",
                        },
                      }}
                    >
                      <AppBar sx={{ position: "relative" }}>
                        <Toolbar>
                          <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => setShowScanner(false)}
                            aria-label="close"
                          >
                            <CloseIcon />
                          </IconButton>
                          <Typography
                            sx={{ ml: 2, flex: 1 }}
                            variant="h6"
                            component="div"
                          >
                            Leitor de QR Code
                          </Typography>
                        </Toolbar>
                      </AppBar>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "calc(100% - 64px)",
                          padding: 2,
                        }}
                      >
                        {showScanner && (
                          <QrCodeReader
                            onScan={(result) => {
                              setQrCodeLink(result);
                              setShowScanner(false);
                            }}
                          />
                        )}
                        <Typography
                          variant="body1"
                          color="white"
                          sx={{ mt: 2 }}
                        >
                          Posicione o QR Code dentro da área delimitada
                        </Typography>
                      </Box>
                    </Dialog>
                  </>
                )}
              </Grid>
            </Box>
            <Box>
              {QRcodeCpf && <img src={QRcodeCpf} alt="QR Code" />}
              {qrCodeLinkImage && <p>Link: {qrCodeLinkImage}</p>}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Checkin;
