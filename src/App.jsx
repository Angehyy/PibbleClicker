import { useState, useEffect } from "react";
import pibble from "./assets/pibble.jpg";
import styles from "./App.module.css";

import { Box, Button, Typography, Stack, Paper } from "@mui/material";

function App() {
  const [count, setCount] = useState(0);
  const [pibblesPerClick, setPibblesPerClick] = useState(1);

  const [upgrades, setUpgrades] = useState([
    { id: 1, label: "Click Upgrade 1", cost: 50, value: 5, level: 0, pps: 0 },
    { id: 2, label: "Click Upgrade 2", cost: 100, value: 10, level: 0, pps: 0 },
    { id: 3, label: "Click Upgrade 3", cost: 200, value: 20, level: 0, pps: 0 },
    { id: 4, label: "Auto Upgrade 1", cost: 100, value: 0, level: 0, pps: 1 }, // passive
    { id: 5, label: "Auto Upgrade 2", cost: 300, value: 0, level: 0, pps: 5 }  // passive
  ]);

  // Increment main Pibble counter
  const handlePibbleClick = () => {
    setCount((prev) => prev + pibblesPerClick);
  };

  // Handle buying upgrades
  const handleUpgrade = (id) => {
    setUpgrades((prev) =>
      prev.map((upgrade) => {
        if (upgrade.id === id && count >= upgrade.cost) {
          setCount((prevCount) => prevCount - upgrade.cost);
          // If it's a click upgrade, increase ppc
          if (upgrade.value > 0) {
            setPibblesPerClick((prevPPC) => prevPPC + upgrade.value);
          }
          return {
            ...upgrade,
            level: upgrade.level + 1,
            cost: Math.floor(upgrade.cost * 1.5)
          };
        }
        return upgrade;
      })
    );
  };

  // Passive Pibbles per second
  useEffect(() => {
    const interval = setInterval(() => {
      const totalPPS = upgrades.reduce((sum, u) => sum + u.pps * u.level, 0);
      if (totalPPS > 0) {
        setCount((prev) => prev + totalPPS);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [upgrades]);

  return (
    <Box display="flex" height="100vh" p={4}>
      {/* Left Side - Achievements */}
      <Box flex={1}>
        <Button variant="contained">Achievements</Button>
      </Box>

      {/* Middle - Pibble Counter */}
      <Box flex={2} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h3">{count} Pibbles</Typography>
        <Typography variant="h5">Per Click: {pibblesPerClick}</Typography>
        <Button onClick={handlePibbleClick}>
          <img src={pibble} alt="pibble" height="500px" />
        </Button>
        <Typography>Wash my Bellay</Typography>
      </Box>

      {/* Right Side - Upgrades */}
      <Box flex={1} display="flex" flexDirection="column" gap={2}>
        {upgrades.map((upgrade) => (
          <Paper key={upgrade.id} elevation={3} sx={{ p: 2 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleUpgrade(upgrade.id)}
              sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
            >
              <span>{upgrade.label}</span>
              {upgrade.value > 0 && <span>Clicks/Click: {upgrade.value}</span>}
              {upgrade.pps > 0 && <span>Pibbles/sec: {upgrade.pps}</span>}
              <span>Cost: {upgrade.cost}</span>
              <span>Level: {upgrade.level}</span>
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default App;


