import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  LocateFixed,
  MapPin,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react-native';

import {
  searchNepalLocations,
  type NepalLocationItem,
} from '../../constants/nepalLocations';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { searchOnlineNepalLocations } from '../../utils/geocoding';
import {
  addRecentLocation,
  clearRecentLocations,
  getRecentLocations,
  type RecentLocationItem,
} from '../../utils/recentSearchesStorage';
import { hapticFeedback } from '../../utils/haptics';
import { FullScreenMapPicker, type LocationSelectionResult } from './FullScreenMapPicker';

export interface LocationPickerModalProps {
  visible: boolean;
  mode: 'pickup' | 'dropoff';
  currentValue?: string;
  onSelect: (locationName: string, item?: NepalLocationItem) => void;
  onClose: () => void;
}

export function LocationPickerModal({
  visible,
  mode,
  currentValue = '',
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 6 && Math.abs(gesture.dx) < 20;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80 || gesture.vy > 0.4) {
          hapticFeedback.light();
          Animated.timing(translateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const [query, setQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocationItem[]>([]);
  const [onlineResults, setOnlineResults] = useState<NepalLocationItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setQuery('');
      setShowMap(false);
      setOnlineResults([]);
      setIsSearchingOnline(false);

      // Load persistent recent searches
      getRecentLocations().then(setRecentLocations);

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [visible, currentValue, mode]);

  // Live real-world Nepal search query with debouncing
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const debounceTimer = setTimeout(() => {
      searchOnlineNepalLocations(trimmed)
        .then((results) => {
          setOnlineResults(results);
        })
        .catch(() => {
          setOnlineResults([]);
        })
        .finally(() => {
          setIsSearchingOnline(false);
        });
    }, 280);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Merge fast curated local catalog with live real-world OSM results
  const filteredLocations = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const localList = searchNepalLocations(query);

    // Map by normalized name to prevent duplicate entries
    const seen = new Set<string>();
    const merged: NepalLocationItem[] = [];

    // Add local curated matches first
    for (const item of localList) {
      const key = item.name.toLowerCase().replace(/,\s*nepal$/i, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    // Add live online real-world locations
    for (const item of onlineResults) {
      const key = item.name.toLowerCase().replace(/,\s*nepal$/i, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }, [query, onlineResults]);

  const handleSelectItem = (item: { name: string; secondaryText?: string }) => {
    hapticFeedback.selection();
    addRecentLocation(item.name, item.secondaryText);
    onSelect(item.name);
    onClose();
  };

  const handleClearRecents = async () => {
    hapticFeedback.light();
    await clearRecentLocations();
    setRecentLocations([]);
  };

  const handleMapConfirm = (result: LocationSelectionResult) => {
    hapticFeedback.success();
    addRecentLocation(result.name, result.secondaryText);
    onSelect(result.name);
    setShowMap(false);
    onClose();
  };

  const isQueryEmpty = query.trim().length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={!showMap}
      statusBarTranslucent={true}
      onRequestClose={showMap ? () => setShowMap(false) : onClose}
    >
      {showMap ? (
        /* DEDICATED FULL-SCREEN INTERACTIVE MAP PICKER */
        <FullScreenMapPicker
          mode={mode}
          initialLocationName={currentValue}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}
        />
      ) : (
        /* BOTTOM SHEET SEARCH & LIST VIEW */
        <View style={styles.modalBackdrop}>
          {/* Tap outside to dismiss */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              hapticFeedback.light();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss location selector"
          />

          {/* Bottom Sheet Card */}
          <Animated.View
            style={[
              styles.sheetCard,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Top Drag Handle Zone */}
            <View {...panResponder.panHandlers} style={{ paddingTop: 10, paddingBottom: 4 }}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.contentRoot}>
              {/* Top Bar: Title & Close Button */}
              <View style={styles.topHeader}>
                <View style={{ width: 28 }} />

                <Text style={styles.titleText}>
                  {mode === 'pickup' ? 'Select Pickup Location' : 'Select Destination'}
                </Text>

                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    onClose();
                  }}
                  hitSlop={12}
                  style={styles.closeIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close location selection"
                >
                  <X size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Search Input Box */}
              <View style={styles.searchBox}>
                <LocateFixed size={18} color={colors.subtle} style={styles.searchLeftIcon} />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={mode === 'pickup' ? 'Search Pickup Location' : 'Search Drop-off Location'}
                  placeholderTextColor={colors.subtle}
                  style={styles.searchInput}
                  autoCapitalize="words"
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {isSearchingOnline && (
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 6 }} />
                )}
                {query.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setQuery('');
                      setOnlineResults([]);
                      inputRef.current?.focus();
                    }}
                    hitSlop={8}
                    style={styles.clearBtn}
                  >
                    <XCircle size={18} color={colors.accent} />
                  </Pressable>
                )}
              </View>

              {/* Primary Action: Select Location On Map Button */}
              <Pressable
                onPress={() => {
                  hapticFeedback.medium();
                  setShowMap(true);
                }}
                style={({ pressed }) => [styles.mapActionBtn, pressed && styles.pressedBtn]}
                accessibilityRole="button"
                accessibilityLabel="Select Location On Map"
              >
                <LocateFixed size={20} color="#FFFFFF" />
                <Text style={styles.mapActionBtnText}>Select Location On Map</Text>
              </Pressable>

              {/* RECENT SEARCHES OR SEARCH RESULTS */}
              <ScrollView
                style={styles.listScrollView}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {isQueryEmpty ? (
                  /* RECENT SEARCHES VIEW ONLY */
                  <View>
                    {recentLocations.length > 0 ? (
                      <View>
                        <View style={styles.sectionHeaderRow}>
                          <Text style={styles.sectionHeaderText}>RECENT SEARCHES</Text>
                          <Pressable
                            onPress={handleClearRecents}
                            hitSlop={8}
                            style={styles.clearRecentsBtn}
                          >
                            <Text style={styles.clearRecentsText}>Clear</Text>
                          </Pressable>
                        </View>

                        {recentLocations.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => handleSelectItem(item)}
                            style={({ pressed }) => [styles.listItemRow, pressed && styles.pressedRow]}
                            accessibilityRole="button"
                            accessibilityLabel={item.name}
                          >
                            <Clock size={18} color={colors.muted} style={styles.listItemIcon} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.listItemText} numberOfLines={1}>
                                {item.name}
                              </Text>
                              {item.secondaryText ? (
                                <Text style={styles.listItemSecondaryText} numberOfLines={1}>
                                  {item.secondaryText}
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      /* CLEAN EMPTY STATE WHEN NO RECENT SEARCHES */
                      <View style={styles.emptyState}>
                        <Clock size={28} color={colors.subtle} style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyTitle}>No Recent Searches</Text>
                        <Text style={styles.emptySubtitle}>
                          Search a destination above or select a point directly on the map.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  /* ACTIVE LIVE SEARCH RESULTS VIEW */
                  <View>
                    {filteredLocations.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleSelectItem(item)}
                        style={({ pressed }) => [styles.listItemRow, pressed && styles.pressedRow]}
                        accessibilityRole="button"
                        accessibilityLabel={item.name}
                      >
                        <MapPin size={18} color={colors.accent} style={styles.listItemIcon} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listItemText} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.secondaryText ? (
                            <Text style={styles.listItemSecondaryText} numberOfLines={1}>
                              {item.secondaryText}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    ))}

                    {filteredLocations.length === 0 && !isSearchingOnline && (
                      <View style={styles.emptyState}>
                        <Search size={28} color={colors.subtle} style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyTitle}>No Matching Locations</Text>
                        <Text style={styles.emptySubtitle}>
                          Try another search or tap "Select Location On Map" to pinpoint.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
    },
    sheetCard: {
      width: '100%',
      maxWidth: 540,
      alignSelf: 'center',
      height: '78%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 20,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    contentRoot: {
      flex: 1,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
      textAlign: 'center',
      flex: 1,
    },
    closeIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.sm + 2,
      height: 48,
    },
    searchLeftIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      paddingVertical: 0,
    },
    clearBtn: {
      padding: 4,
    },
    mapActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      marginHorizontal: spacing.lg,
      height: 48,
      marginBottom: spacing.sm,
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    mapActionBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    sectionHeaderText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 0.5,
    },
    clearRecentsBtn: {
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    clearRecentsText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
    listScrollView: {
      flex: 1,
    },
    listContent: {
      paddingTop: spacing.xs,
    },
    listItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listItemIcon: {
      marginRight: 14,
    },
    listItemText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    listItemSecondaryText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    pressedRow: {
      backgroundColor: colors.elevated,
    },
    pressedBtn: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 240,
    },
  });
}
