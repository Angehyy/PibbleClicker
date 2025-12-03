import { useState, useEffect } from "react";
import pibble1 from "./assets/pibble-1.webp";
import pibble2 from "./assets/pibble-2.webp";
import pibble3 from "./assets/pibble-3.webp";
import pibble4 from "./assets/pibble-4.webp";
import autoUpgrade from "./assets/auto-upgrade.webp";
import styles from "./App.module.css";

import { 
  Box, 
  Button, 
  Typography, 
  Stack, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider
} from "@mui/material";

// Screen states
const SCREENS = {
  BEGIN: 'begin',
  SAVE_SLOTS: 'save_slots',
  GAME: 'game'
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_click', name: 'First Click!', description: 'Click the pibble for the first time', condition: (state) => state.totalClicks >= 1 },
  { id: 'hundred_pibbles', name: 'Century Club', description: 'Reach 100 pibbles', condition: (state) => state.count >= 100 },
  { id: 'thousand_pibbles', name: 'Thousandaire', description: 'Reach 1,000 pibbles', condition: (state) => state.count >= 1000 },
  { id: 'first_upgrade', name: 'Upgrade Master', description: 'Buy your first upgrade', condition: (state) => state.upgrades.some(u => u.level > 0) },
  { id: 'ten_clicks', name: 'Clicking Pro', description: 'Click 10 times', condition: (state) => state.totalClicks >= 10 },
  { id: 'hundred_clicks', name: 'Clicking Master', description: 'Click 100 times', condition: (state) => state.totalClicks >= 100 },
  { id: 'auto_income', name: 'Passive Income', description: 'Buy your first auto upgrade', condition: (state) => state.upgrades.some(u => u.pps > 0 && u.level > 0) },
  { id: 'millionaire', name: 'Millionaire', description: 'Reach 1,000,000 pibbles', condition: (state) => state.count >= 1000000 }
];

const createEmptySlots = () => ({
  slot1: null,
  slot2: null,
  slot3: null
});

const getStoredSlots = () => {
  if (typeof window === "undefined") {
    return createEmptySlots();
  }

  try {
    const saved = localStorage.getItem("pibble_save_slots");
    if (!saved) {
      return createEmptySlots();
    }

    const parsed = JSON.parse(saved);
    return {
      slot1: parsed.slot1 ?? null,
      slot2: parsed.slot2 ?? null,
      slot3: parsed.slot3 ?? null
    };
  } catch (error) {
    console.error("Error loading save slots:", error);
    return createEmptySlots();
  }
};

function App() {
  // Screen management
  const [currentScreen, setCurrentScreen] = useState(SCREENS.BEGIN);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);

  // Default upgrades structure
  const defaultUpgrades = [
    { id: 1, label: "Click Upgrade", cost: 50, value: 5, level: 0, pps: 0, speedMultiplier: 0, criticalChance: 0, criticalMultiplier: 0 },
    { id: 2, label: "Auto Upgrade", cost: 100, value: 0, level: 0, pps: 1, speedMultiplier: 0, criticalChance: 0, criticalMultiplier: 0 },
    { id: 3, label: "Auto Income Speed", cost: 150, value: 0, level: 0, pps: 0, speedMultiplier: 0.1, criticalChance: 0, criticalMultiplier: 0 },
    { id: 4, label: "Critical Click", cost: 200, value: 0, level: 0, pps: 0, speedMultiplier: 0, criticalChance: 0.05, criticalMultiplier: 3 }
  ];

  // Game state
  const [count, setCount] = useState(0);
  const [pibblesPerClick, setPibblesPerClick] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState(defaultUpgrades);

  // Achievements
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [achievementNotification, setAchievementNotification] = useState(null);
  const [achievementsDialogOpen, setAchievementsDialogOpen] = useState(false);

  // Critical click notification
  const [criticalNotification, setCriticalNotification] = useState(null);

  // Shake animation state
  const [isShaking, setIsShaking] = useState(false);
  const [autoUpgradeShaking, setAutoUpgradeShaking] = useState(false);
  const [currentPibbleImage, setCurrentPibbleImage] = useState(pibble1);
  const [imageChangeNotification, setImageChangeNotification] = useState(null);

  // Save slots
  const [saveSlots, setSaveSlots] = useState(() => getStoredSlots());

  // Get pibble image based on Click Upgrade level
  const getPibbleImage = () => {
    const clickUpgrade = upgrades.find(u => u.id === 1);
    const level = clickUpgrade?.level || 0;
    
    if (level >= 100) return pibble4;
    if (level >= 50) return pibble3;
    if (level >= 15) return pibble2;
    return pibble1;
  };

  // Update pibble image when Click Upgrade level changes
  useEffect(() => {
    if (currentScreen !== SCREENS.GAME) return;
    
    const newImage = getPibbleImage();
    const clickUpgrade = upgrades.find(u => u.id === 1);
    const level = clickUpgrade?.level || 0;
    
    // Check if image should change by comparing with current
    if (newImage !== currentPibbleImage) {
      let message = '';
      if (level >= 100) message = 'Pibble evolved to MAX level!';
      else if (level >= 50) message = 'Pibble evolved to level 3!';
      else if (level >= 15) message = 'Pibble evolved to level 2!';
      
      if (message) {
        setImageChangeNotification(message);
        setTimeout(() => setImageChangeNotification(null), 3000);
      }
      
      setCurrentPibbleImage(newImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrades, currentScreen]);

  // Load game state from localStorage
  const loadGameState = (slotKey) => {
    try {
      const saved = localStorage.getItem(`pibble_game_${slotKey}`);
      if (saved) {
        const gameState = JSON.parse(saved);
        setCount(gameState.count || 0);
        setPibblesPerClick(gameState.pibblesPerClick || 1);
        setTotalClicks(gameState.totalClicks || 0);
        setUpgrades(gameState.upgrades || defaultUpgrades);
        setUnlockedAchievements(new Set(gameState.unlockedAchievements || []));
        // Set the correct pibble image based on loaded upgrades
        const clickUpgrade = (gameState.upgrades || defaultUpgrades).find(u => u.id === 1);
        const level = clickUpgrade?.level || 0;
        if (level >= 100) setCurrentPibbleImage(pibble4);
        else if (level >= 50) setCurrentPibbleImage(pibble3);
        else if (level >= 15) setCurrentPibbleImage(pibble2);
        else setCurrentPibbleImage(pibble1);
        return true;
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      alert('Error loading game. Starting fresh.');
    }
    return false;
  };

  // Save game state to localStorage
  const saveGameState = (slotKey) => {
    try {
      const gameState = {
        count,
        pibblesPerClick,
        totalClicks,
        upgrades,
        unlockedAchievements: Array.from(unlockedAchievements),
        lastSaved: Date.now()
      };
      localStorage.setItem(`pibble_game_${slotKey}`, JSON.stringify(gameState));
      
      // Update save slot metadata
      const slots = { ...saveSlots };
      slots[slotKey] = {
        lastSaved: Date.now(),
        pibbles: count,
        totalClicks: totalClicks
      };
      setSaveSlots(slots);
      localStorage.setItem('pibble_save_slots', JSON.stringify(slots));
    } catch (error) {
      console.error('Error saving game state:', error);
      alert('Error saving game. Please try again.');
    }
  };

  // Persist game state locally on every change
  useEffect(() => {
    if (currentScreen !== SCREENS.GAME || !selectedSlot) {
      return;
    }

    const lastSaved = Date.now();
    const gameState = {
      count,
      pibblesPerClick,
      totalClicks,
      upgrades,
      unlockedAchievements: Array.from(unlockedAchievements),
      lastSaved
    };

    try {
      localStorage.setItem(`pibble_game_${selectedSlot}`, JSON.stringify(gameState));

      const slots = getStoredSlots();
      slots[selectedSlot] = {
        lastSaved,
        pibbles: count,
        totalClicks
      };
      localStorage.setItem('pibble_save_slots', JSON.stringify(slots));
    } catch (error) {
      console.error('Error performing local save:', error);
    }
  }, [count, pibblesPerClick, totalClicks, upgrades, unlockedAchievements, currentScreen, selectedSlot]);

  // Check achievements
  useEffect(() => {
    if (currentScreen !== SCREENS.GAME) return;

    const gameState = {
      count,
      totalClicks,
      upgrades,
      unlockedAchievements
    };

    ACHIEVEMENTS.forEach(achievement => {
      if (!unlockedAchievements.has(achievement.id) && achievement.condition(gameState)) {
        setUnlockedAchievements(prev => new Set([...prev, achievement.id]));
        setAchievementNotification(achievement);
      }
    });
  }, [count, totalClicks, upgrades, unlockedAchievements, currentScreen]);

  // Auto-hide achievement notification after 5 seconds
  useEffect(() => {
    if (achievementNotification) {
      const timer = setTimeout(() => {
        setAchievementNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievementNotification]);

  // Auto-hide critical notification after 2 seconds
  useEffect(() => {
    if (criticalNotification) {
      const timer = setTimeout(() => {
        setCriticalNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [criticalNotification]);

  // Increment main Pibble counter
  const handlePibbleClick = () => {
    // Trigger shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);
    
    // Calculate total critical chance and multiplier
    const totalCriticalChance = upgrades.reduce((sum, u) => sum + u.criticalChance * u.level, 0);
    const totalCriticalMultiplier = upgrades.reduce((sum, u) => sum + u.criticalMultiplier * u.level, 0);
    
    // Check for critical hit
    const isCritical = Math.random() < totalCriticalChance;
    let earnedPibbles = pibblesPerClick;
    
    if (isCritical && totalCriticalMultiplier > 0) {
      earnedPibbles = Math.floor(pibblesPerClick * totalCriticalMultiplier);
      setCriticalNotification({
        message: `CRITICAL HIT!`,
        bonus: earnedPibbles - pibblesPerClick
      });
    }
    
    setCount((prev) => prev + earnedPibbles);
    setTotalClicks((prev) => prev + 1);
  };

  // Handle buying upgrades
  const handleUpgrade = (id) => {
    setUpgrades((prev) =>
      prev.map((upgrade) => {
        if (upgrade.id === id && count >= upgrade.cost) {
          setCount((prevCount) => prevCount - upgrade.cost);
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
    if (currentScreen !== SCREENS.GAME) return;
    
    // Calculate total speed multiplier (reduces interval time)
    const totalSpeedMultiplier = upgrades.reduce((sum, u) => sum + u.speedMultiplier * u.level, 0);
    const baseInterval = 1000; // 1 second base
    const intervalTime = Math.max(100, baseInterval / (1 + totalSpeedMultiplier)); // Minimum 100ms
    
    const interval = setInterval(() => {
      const totalPPS = upgrades.reduce((sum, u) => sum + u.pps * u.level, 0);
      if (totalPPS > 0) {
        setCount((prev) => prev + totalPPS);
        // Trigger shake animation for auto-upgrade indicator
        setAutoUpgradeShaking(true);
        setTimeout(() => setAutoUpgradeShaking(false), 200);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [upgrades, currentScreen]);

  // Screen handlers
  const handleBegin = () => {
    setCurrentScreen(SCREENS.SAVE_SLOTS);
  };

  const handleSlotSelect = (slotKey) => {
    setSelectedSlot(slotKey);
    if (saveSlots[slotKey]) {
      // Slot has data - show start/delete options
      setCurrentScreen(SCREENS.SAVE_SLOTS);
    } else {
      // Empty slot - start new game
      startNewGame(slotKey);
    }
  };

  const startNewGame = (slotKey) => {
    setCount(0);
    setPibblesPerClick(1);
    setTotalClicks(0);
    setUpgrades(defaultUpgrades);
    setUnlockedAchievements(new Set());
    setCurrentPibbleImage(pibble1);
    setSelectedSlot(slotKey);
    setCurrentScreen(SCREENS.GAME);
  };

  const handleStartSlot = (slotKey) => {
    if (loadGameState(slotKey)) {
      setSelectedSlot(slotKey);
      setCurrentScreen(SCREENS.GAME);
    } else {
      startNewGame(slotKey);
    }
  };

  const handleDeleteSlot = (slotKey) => {
    setSlotToDelete(slotKey);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSlot = () => {
    if (slotToDelete) {
      try {
        localStorage.removeItem(`pibble_game_${slotToDelete}`);
        const slots = { ...saveSlots };
        slots[slotToDelete] = null;
        setSaveSlots(slots);
        localStorage.setItem('pibble_save_slots', JSON.stringify(slots));
        setDeleteDialogOpen(false);
        setSlotToDelete(null);
      } catch (error) {
        console.error('Error deleting save:', error);
        alert('Error deleting save. Please try again.');
      }
    }
  };

  const handleSaveAndQuit = () => {
    if (selectedSlot) {
      saveGameState(selectedSlot);
      setCurrentScreen(SCREENS.SAVE_SLOTS);
      setSelectedSlot(null);
    }
  };

  // Render Begin Screen
  if (currentScreen === SCREENS.BEGIN) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Typography variant="h1" sx={{ mb: 4, color: 'white', fontWeight: 'bold' }}>
          Pibble Clicker
        </Typography>
        <Typography variant="h5" sx={{ mb: 6, color: 'white', opacity: 0.9 }}>
          Wash my Bellay!
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={handleBegin}
          sx={{ 
            fontSize: '1.5rem', 
            px: 6, 
            py: 2,
            background: 'white',
            color: '#667eea',
            '&:hover': {
              background: '#f0f0f0',
              transform: 'scale(1.05)'
            }
          }}
        >
          Begin
        </Button>
      </Box>
    );
  }

  // Render Save Slots Screen
  if (currentScreen === SCREENS.SAVE_SLOTS) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 4 }}
      >
        <Typography variant="h2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
          Select Save Slot
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'white', opacity: 0.9 }}>
          Create multiple save files to try different strategies!
        </Typography>
        <Stack direction="row" spacing={4} sx={{ width: '80%', maxWidth: 900 }}>
          {['slot1', 'slot2', 'slot3'].map((slotKey, index) => {
            const slotData = saveSlots[slotKey];
            const hasData = slotData !== null;
            
            return (
              <Card 
                key={slotKey}
                sx={{ 
                  flex: 1, 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                  background: hasData ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)'
                }}
                onClick={() => handleSlotSelect(slotKey)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <img 
                      src={[pibble1, pibble2, pibble3][index]} 
                      alt={`pibble ${index + 1}`}
                      style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {slotKey.toUpperCase().replace('SLOT', 'Slot ')}
                    </Typography>
                  </Box>
                  {hasData ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Pibbles: {slotData.pibbles?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Total Clicks: {slotData.totalClicks?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Last Saved: {new Date(slotData.lastSaved).toLocaleString()}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSlot(slotKey);
                          }}
                        >
                          Start
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlot(slotKey);
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2 }}>
                      Empty Slot - Click to Start New Game
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Save Slot?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this save slot? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteSlot} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Render Game Screen
  return (
    <Box display="flex" height="100vh" p={4} sx={{ background: '#ffffff' }}>
      {/* Left Side - Save & Quit */}
      <Box flex={1} display="flex" flexDirection="column" alignItems="flex-start">
        <Button 
          variant="outlined" 
          onClick={handleSaveAndQuit}
          sx={{ mt: 2 }}
        >
          Save & Quit
        </Button>
      </Box>

      {/* Middle - Pibble Counter */}
      <Box flex={2} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => setAchievementsDialogOpen(true)}
            sx={{ 
              fontSize: '1rem',
              px: 3,
              py: 1
            }}
          >
            Achievements
          </Button>
        </Box>
        <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
          {count.toLocaleString()} Pibbles
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Per Click: {pibblesPerClick}
        </Typography>
        {(() => {
          const totalCriticalChance = upgrades.reduce((sum, u) => sum + u.criticalChance * u.level, 0);
          const totalCriticalMultiplier = upgrades.reduce((sum, u) => sum + u.criticalMultiplier * u.level, 0);
          if (totalCriticalChance > 0 && totalCriticalMultiplier > 0) {
            return (
              <Typography variant="body2" sx={{ mb: 1, color: '#ff6b00', fontWeight: 'bold' }}>
                Critical: {(totalCriticalChance * 100).toFixed(1)}% chance for {totalCriticalMultiplier.toFixed(1)}x
              </Typography>
            );
          }
          return null;
        })()}
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Total Clicks: {totalClicks.toLocaleString()}
        </Typography>
        {(() => {
          const clickUpgrade = upgrades.find(u => u.id === 1);
          const level = clickUpgrade?.level || 0;
          let evolutionText = '';
          if (level >= 100) evolutionText = 'MAX Evolution';
          else if (level >= 50) evolutionText = 'Evolution Level 3';
          else if (level >= 15) evolutionText = 'Evolution Level 2';
          else evolutionText = 'Evolution Level 1';
          
          return (
            <Typography variant="body2" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
              {evolutionText}
            </Typography>
          );
        })()}
        <Box display="flex" alignItems="center" gap={3}>
          <Button 
            onClick={handlePibbleClick}
            disableRipple
            sx={{ 
              '&:hover': { 
                transform: 'scale(1.05)',
                background: 'transparent',
                boxShadow: 'none'
              },
              '&:active': { transform: 'scale(1.05)' },
              transition: 'transform 0.1s',
              p: 0,
              background: 'transparent',
              boxShadow: 'none'
            }}
          >
            <img 
              src={currentPibbleImage} 
              alt="pibble" 
              height="500px" 
              className={isShaking ? styles.shaking : ''}
              style={{ 
                cursor: 'pointer',
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease-in-out'
              }} 
            />
          </Button>
          {(() => {
            const autoUpgradeLevel = upgrades.find(u => u.id === 2)?.level || 0;
            if (autoUpgradeLevel > 0) {
              return (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <img 
                    src={autoUpgrade} 
                    alt="auto upgrade" 
                    height="150px"
                    className={autoUpgradeShaking ? styles.shaking : ''}
                    style={{ 
                      transition: 'opacity 0.3s ease-in-out'
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Auto Income
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}
        </Box>
      </Box>

      {/* Right Side - Upgrades */}
      <Box flex={1} display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Upgrades
        </Typography>
        {upgrades.map((upgrade) => {
          const canAfford = count >= upgrade.cost;
          return (
            <Paper key={upgrade.id} elevation={3} sx={{ p: 2 }}>
              <Button
                variant={canAfford ? "contained" : "outlined"}
                fullWidth
                disabled={!canAfford}
                onClick={() => handleUpgrade(upgrade.id)}
                sx={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "flex-start",
                  textTransform: 'none',
                  py: 1.5
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {upgrade.label}
                </Typography>
                {upgrade.value > 0 && (
                  <Typography variant="body2">
                    +{upgrade.value} Pibbles/Click
                  </Typography>
                )}
                {upgrade.pps > 0 && (
                  <Typography variant="body2">
                    +{upgrade.pps} Pibbles/sec
                  </Typography>
                )}
                {upgrade.speedMultiplier > 0 && (
                  <Typography variant="body2">
                    +{(upgrade.speedMultiplier * 100).toFixed(0)}% Auto Income Speed
                  </Typography>
                )}
                {upgrade.criticalChance > 0 && (
                  <Typography variant="body2" sx={{ color: '#ff6b00', fontWeight: 'bold' }}>
                    +{(upgrade.criticalChance * 100).toFixed(1)}% Critical Chance ({upgrade.criticalMultiplier.toFixed(1)}x multiplier)
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                  Cost: {upgrade.cost.toLocaleString()} Pibbles
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Level: {upgrade.level}
                </Typography>
              </Button>
            </Paper>
          );
        })}
      </Box>

      {/* Achievements Overlay Dialog */}
      <Dialog 
        open={achievementsDialogOpen} 
        onClose={() => setAchievementsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Achievements
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {unlockedAchievements.size} / {ACHIEVEMENTS.length} Unlocked
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievements.has(achievement.id);
              return (
                <Paper 
                  key={achievement.id}
                  elevation={2}
                  sx={{ 
                    p: 2,
                    opacity: isUnlocked ? 1 : 0.6,
                    background: isUnlocked ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : '#f5f5f5',
                    border: isUnlocked ? '2px solid #4caf50' : '2px solid transparent',
                    transition: 'all 0.3s'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    {isUnlocked && (
                      <Typography variant="h4" sx={{ color: 'success.main' }}>
                        ✓
                      </Typography>
                    )}
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: isUnlocked ? 'bold' : 'normal', mb: 0.5 }}>
                        {achievement.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {achievement.description}
                      </Typography>
                    </Box>
                    {!isUnlocked && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        Locked
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAchievementsDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Achievement Notification */}
      <Snackbar
        open={achievementNotification !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 4 }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            fontSize: '1.1rem',
            minWidth: '300px',
            '& .MuiAlert-icon': { fontSize: '2rem' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Achievement Unlocked!
          </Typography>
          <Typography variant="subtitle1">
            {achievementNotification?.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            {achievementNotification?.description}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Critical Hit Notification */}
      <Snackbar
        open={criticalNotification !== null}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          severity="warning" 
          sx={{ 
            fontSize: '1.2rem',
            minWidth: '250px',
            background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%)',
            color: 'white',
            fontWeight: 'bold',
            '& .MuiAlert-icon': { fontSize: '2.5rem', color: 'white' }
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {criticalNotification?.message}
          </Typography>
          <Typography variant="h6">
            +{criticalNotification?.bonus?.toLocaleString()} Bonus Pibbles!
          </Typography>
        </Alert>
      </Snackbar>

      {/* Image Change Notification */}
      <Snackbar
        open={imageChangeNotification !== null}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 12 }}
      >
        <Alert 
          severity="info" 
          sx={{ 
            fontSize: '1.1rem',
            minWidth: '300px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            '& .MuiAlert-icon': { fontSize: '2rem', color: 'white' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {imageChangeNotification}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
