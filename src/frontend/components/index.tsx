import React, { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
import {
  AppBar,
  Toolbar,
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { UserLocalStorage } from "../types";
import { useNavigate } from "react-router-dom";

interface CustomAppBarProps {
  isDesktop?: boolean;
  user?: UserLocalStorage | null;
  settings?: string[];
  handleOpenUserMenu?: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseUserMenu?: () => void;
  handleToProfile?: () => void;
  anchorElUser?: HTMLElement | null;
  logout?: () => void;
}

interface QrCodeReaderProps {
  onScan: (decodedText: string) => void;
}

export const QrCodeReader: React.FC<QrCodeReaderProps> = ({ onScan }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scannerContainerRef.current;
    if (!container) return;

    const html5QrCode = new Html5Qrcode(container.id);
    html5QrCodeRef.current = html5QrCode;

    const qrCodeSuccessCallback = (decodedText: string) => {
      console.log("QR code lido:", decodedText);
      onScan(decodedText);
    };

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Ignora mensagens de erro específicas
          if (
            !errorMessage.includes("No MultiFormat Readers were able to detect")
          ) {
            console.error("Erro ao ler QR code:", errorMessage);
          }
        }
      )
      .catch((err) => {
        console.error("Erro ao iniciar scanner:", err);
      });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log("Scanner parado com sucesso");
          })
          .catch((err) => {
            console.error("Erro ao parar scanner:", err);
          });
      }
    };
  }, [onScan]);

  return (
    <div
      id="qr-reader-container"
      ref={scannerContainerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export const CustomAppBar: React.FC<CustomAppBarProps> = ({
  isDesktop,
  user,
  settings,
  handleOpenUserMenu,
  handleCloseUserMenu,
  anchorElUser,
  handleToProfile,
  logout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#00df81",
        height: "65px",
        justifyContent: "center",
        paddingInline: { xl: 10, md: 5, sm: "20px" },
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          paddingInline: { xl: 10, md: 5, sm: 0 },
        }}
      >
        <Box
          component="img"
          src="/flowpass-favicon.png"
          alt="Logo"
          sx={{
            width: "50px",
            height: "50px",
            marginRight: { xs: "10px", sm: "20px" }, // Estilo responsivo
            cursor: "pointer",
            transition: "transform 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
          onClick={() => {
            navigate("/checkin");
          }}
        />

        <Box
          sx={{ flexGrow: 0, alignItems: "center" }}
          flexDirection="row"
          display={"flex"}
        >
          <Chip
            label={user?.profile}
            size="small"
            color="secondary"
            sx={{ marginInline: 5 }}
          />
          {isDesktop && (
            <Typography variant="h6" sx={{ marginRight: "20px" }}>
              {user?.name}
            </Typography>
          )}
          <Tooltip title="Seu Menú">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              {isDesktop ? <AccountCircle /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings?.map((setting) => (
              <MenuItem
                key={setting}
                onClick={() => {
                  if (setting === "Logout") {
                    logout?.(); // Chama a função logout
                  } else if (setting === "Perfil") {
                    handleToProfile?.();
                  } else {
                    handleCloseUserMenu?.();
                  }
                }}
              >
                <Typography sx={{ textAlign: "center" }}>{setting}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
