import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Check,
  Crosshair,
  MapPin,
  Minus,
  Navigation,
  Plus,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { resolveLocationName } from '../../utils/geocoding';
import { hapticFeedback } from '../../utils/haptics';

export interface LocationSelectionResult {
  name: string;
  secondaryText?: string;
  latitude: number;
  longitude: number;
}

export interface FullScreenMapPickerProps {
  mode: 'pickup' | 'dropoff';
  initialLocationName?: string;
  initialCoords?: { latitude: number; longitude: number };
  onConfirm: (result: LocationSelectionResult) => void;
  onCancel: () => void;
}

export function FullScreenMapPicker({
  mode,
  initialLocationName = '',
  initialCoords,
  onConfirm,
  onCancel,
}: FullScreenMapPickerProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // Compute starting coordinates
  const startingCoords = useMemo(() => {
    if (initialCoords?.latitude && initialCoords?.longitude) {
      return { lat: initialCoords.latitude, lng: initialCoords.longitude };
    }
    const lower = initialLocationName.toLowerCase();
    if (lower.includes('pokhara')) return { lat: 28.2096, lng: 83.9595 };
    if (lower.includes('chitwan') || lower.includes('sauraha')) return { lat: 27.5804, lng: 84.4981 };
    if (lower.includes('nagarkot')) return { lat: 27.7175, lng: 85.5200 };
    if (lower.includes('airport') || lower.includes('tia')) return { lat: 27.6966, lng: 85.3591 };
    return { lat: 27.7172, lng: 85.3240 }; // Kathmandu center default
  }, [initialCoords, initialLocationName]);

  const [currentCoords, setCurrentCoords] = useState(startingCoords);
  const [selectedPlaceName, setSelectedPlaceName] = useState(
    initialLocationName || (mode === 'pickup' ? 'Kathmandu, Nepal' : 'Pokhara, Nepal'),
  );
  const [secondaryAddress, setSecondaryAddress] = useState('Nepal Region');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Animated pin lift
  const pinLiftAnim = useRef(new Animated.Value(0)).current;

  const handleMapMoveStart = useCallback(() => {
    setIsMapMoving(true);
    Animated.timing(pinLiftAnim, {
      toValue: -12,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [pinLiftAnim]);

  const handleMapMoveEnd = useCallback(
    (lat: number, lng: number) => {
      setIsMapMoving(false);
      Animated.spring(pinLiftAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      setCurrentCoords({ lat, lng });
      setIsResolvingAddress(true);

      // Debounced reverse geocoding
      resolveLocationName(lat, lng)
        .then((result) => {
          setSelectedPlaceName(result.name);
          setSecondaryAddress(result.secondaryText);
        })
        .catch(() => {
          setSelectedPlaceName(`Pinned Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setSecondaryAddress('Nepal');
        })
        .finally(() => {
          setIsResolvingAddress(false);
        });
    },
    [pinLiftAnim],
  );

  // Handle messages from the embedded Leaflet Map
  const handleMessage = (event: any) => {
    try {
      const raw = typeof event.nativeEvent?.data === 'string' ? event.nativeEvent.data : event.data;
      const data = JSON.parse(raw);

      if (data.type === 'MOVE_START') {
        handleMapMoveStart();
      } else if (data.type === 'MOVE_END') {
        handleMapMoveEnd(data.lat, data.lng);
      }
    } catch {
      // Ignore unparseable post messages
    }
  };

  // GPS Locate Current Position
  const handleLocateMe = async () => {
    hapticFeedback.medium();
    setIsLocatingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        const script = `window.flyToLocation(${lat}, ${lng}, 15);`;
        webViewRef.current?.injectJavaScript(script);
      }
    } catch (e) {
      console.warn('[MapPicker] GPS error:', e);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    hapticFeedback.success();
    onConfirm({
      name: selectedPlaceName,
      secondaryText: secondaryAddress,
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
    });
  };

  // Leaflet Map HTML
  const mapHtml = useMemo(() => {
    const tileUrl = isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${isDark ? '#090D16' : '#F8FAFC'}; }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${startingCoords.lat}, ${startingCoords.lng}], 13);
          L.tileLayer('${tileUrl}', {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(map);

          function postMsg(data) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } else if (window.parent) {
              window.parent.postMessage(JSON.stringify(data), '*');
            }
          }

          map.on('movestart', function() {
            postMsg({ type: 'MOVE_START' });
          });

          map.on('moveend', function() {
            var center = map.getCenter();
            postMsg({ type: 'MOVE_END', lat: center.lat, lng: center.lng });
          });

          window.flyToLocation = function(lat, lng, zoom) {
            map.flyTo([lat, lng], zoom || 14, { duration: 1.2 });
          };

          window.zoomIn = function() { map.zoomIn(); };
          window.zoomOut = function() { map.zoomOut(); };
        </script>
      </body>
      </html>
    `;
  }, [isDark, startingCoords.lat, startingCoords.lng]);

  const isPickup = mode === 'pickup';
  const pinAccentColor = isPickup ? colors.success : colors.accent;

  return (
    <View style={styles.container}>
      {/* Full Screen Interactive Map Canvas */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Interactive Map Location Picker"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webView}
            onMessage={handleMessage}
            scrollEnabled={false}
            nestedScrollEnabled
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>

      {/* Floating Center Pin (Uber / Pathao style) */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.pinWrapper,
            { transform: [{ translateY: pinLiftAnim }] },
          ]}
        >
          <View style={[styles.pinBubble, { backgroundColor: pinAccentColor }]}>
            {isPickup ? (
              <MapPin size={18} color="#FFFFFF" />
            ) : (
              <Navigation size={18} color="#FFFFFF" />
            )}
          </View>
          <View style={[styles.pinStem, { borderTopColor: pinAccentColor }]} />
        </Animated.View>
        <View style={[styles.pinShadow, isMapMoving && styles.pinShadowMoving]} />
      </View>

      {/* Clean Top Floating Navigation Header */}
      <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topHeaderBar}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onCancel();
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {isPickup ? '📍 Pick-up Location' : '🏁 Destination Location'}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Floating Map Zoom & GPS Action Buttons */}
      <View style={styles.floatingControls}>
        <Pressable
          onPress={handleLocateMe}
          style={styles.floatCircleBtn}
          accessibilityLabel="Locate current position"
        >
          {isLocatingGPS ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Crosshair size={20} color={colors.accent} />
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            webViewRef.current?.injectJavaScript('window.zoomIn();');
          }}
          style={styles.floatCircleBtn}
          accessibilityLabel="Zoom In"
        >
          <Plus size={20} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            webViewRef.current?.injectJavaScript('window.zoomOut();');
          }}
          style={styles.floatCircleBtn}
          accessibilityLabel="Zoom Out"
        >
          <Minus size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Bottom Confirmation Card (Uber/Pathao style) */}
      <View
        style={[
          styles.bottomCard,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmBtn,
            { backgroundColor: isPickup ? colors.success : colors.accent },
            pressed && styles.pressedBtn,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Confirm ${isPickup ? 'Pickup' : 'Destination'} Location`}
        >
          {isResolvingAddress ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.confirmBtnText}>
            Confirm {isPickup ? 'Pickup Location' : 'Destination'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    centerPinContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    pinWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    pinBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
    },
    pinStem: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      alignSelf: 'center',
      marginTop: -2,
    },
    pinShadow: {
      width: 14,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      marginTop: -28,
    },
    pinShadowMoving: {
      width: 8,
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    topOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.md,
      zIndex: 20,
    },
    topHeaderBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    modeBadge: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    modeBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    floatingControls: {
      position: 'absolute',
      right: spacing.md,
      bottom: 96,
      gap: 8,
      zIndex: 20,
    },
    floatCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 5,
    },
    bottomCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 16,
      zIndex: 25,
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: radius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 4,
    },
    confirmBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pressedBtn: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
  });
}
