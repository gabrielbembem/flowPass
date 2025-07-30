import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Grid2,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  handleCpfChange,
  validateCPF,
  setAlertFunction,
  showSessionExpiredAlert,
} from "../utils";
import { handleLogin } from "../services";
import { AxiosError } from "axios";
import bgImage from "../../assets/bgmaio2.png";

const Login: React.FC = () => {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [errorCpf, setErrorCpf] = useState(false);
  const [errorPassword, setErrorPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleCheck = async () => {
    setLoading(true);
    const isValid = validateCPF(cpf);
    setErrorCpf(!isValid);

    if (isValid) {
      let cpfReplace = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos do CPF
      try {
        const responseLogin = await handleLogin(cpfReplace, password);
        if (responseLogin) {
          navigate(`/checkin?cpf=${cpf}`);
        }
        setErrorPassword(false);
      } catch (error) {
        console.error("Erro ao fazer login:", error);

        // Captura a mensagem de erro do backend
        if (error instanceof AxiosError && error.response) {
          const { status, data } = error.response;

          if (status === 404) {
            setSnackbarMessage(data.message || "Usuário não encontrado.");
          } else if (status === 401) {
            setErrorPassword(true);
            setSnackbarMessage(data.message || "Senha incorreta.");
          } else {
            setSnackbarMessage("Erro ao fazer login. Tente novamente.");
          }
        } else {
          setSnackbarMessage("Erro ao conectar com o servidor.");
        }

        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handlePassword = () => {};

  const editaCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(handleCpfChange(e.target.value));
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    setAlertFunction((message, severity) => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    });

    // Verifica se foi redirecionado por sessão expirada
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("expired") === "true") {
      showSessionExpiredAlert();
      // Limpa o parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <>
      {/* Corpo */}
      <Container
        sx={{
          display: { xs: "block", sm: "flex" },
          height: "100vh",
          paddingInline: "0px !important",
          maxWidth: "100% !important",
        }}
      >
        {/* Coluna esquerda (4/6) - Imagem de fundo */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: "66.666%",
            backgroundImage: `url(${bgImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Coluna direita (2/6) - Conteúdo */}
        <Box
          sx={{
            width: { xs: "100%", md: "33.333%" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
          }}
        >
          {/* Logo e texto "Flow Pass" */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Grid2>
              <img
                src="flowpass-favicon.png"
                alt="Logo"
                style={{
                  width: "80px",
                  marginBottom: "16px",
                }}
              />
            </Grid2>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.secondary",
                letterSpacing: "-0.8px",
                fontWeight: 700,
                marginTop: "-20px",
              }}
            >
              você no flow
            </Typography>
          </Box>

          {/* Formulário de login */}
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              border: "1px solid lightgray",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            <TextField
              label="Insira seu CPF"
              variant="outlined"
              fullWidth
              value={cpf}
              onChange={editaCpf}
              error={errorCpf}
              helperText={errorCpf ? "CPF inválido ou não encontrado." : ""}
              margin="dense"
              sx={{ marginBottom: "20px" }}
            />
            <TextField
              label="Insira sua senha"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorPassword}
              helperText={errorPassword ? "Senha incorreta" : ""}
              margin="dense"
              type="password"
            />
            <Grid
              container
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Grid item>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#26d07c",
                    marginTop: "15px",
                    "&:hover": { backgroundColor: "#1fa968" },
                    width: "100%",
                  }}
                  disabled={cpf.length !== 14 || !password}
                  onClick={handleCheck}
                >
                  {loading ? (
                    <CircularProgress
                      sx={{
                        color: "white",
                      }}
                      size={24}
                    />
                  ) : (
                    "Iniciar sessão"
                  )}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="text"
                  sx={{
                    marginTop: "10px",
                    "&:hover": { backgroundColor: "#caffd2" },
                    width: "100%",
                    alignSelf: "flex-start",
                    color: "#021b1a",
                  }}
                  onClick={handlePassword}
                >
                  Esqueceu a senha?
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
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
      </Container>
    </>
  );
};

export default Login;
