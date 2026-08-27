import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  name: string;
}

export const FAMOUS_NEPAL_COORDINATES: Record<string, LocationCoordinate> = {
  'TIA Airport': { latitude: 27.6966, longitude: 85.3591, name: 'Tribhuvan Int’l Airport (TIA)' },
  'Thamel': { latitude: 27.7154, longitude: 85.3123, name: 'Thamel, Kathmandu' },
  'Patan Durbar': { latitude: 27.6744, longitude: 85.3250, name: 'Patan Durbar Square' },
  'Bhaktapur': { latitude: 27.6710, longitude: 85.4298, name: 'Bhaktapur Durbar Square' },
  'Nagarkot': { latitude: 27.7175, longitude: 85.5200, name: 'Nagarkot Sunrise Viewpoint' },
  'Pokhara Lakeside': { latitude: 28.2096, longitude: 83.9595, name: 'Pokhara Lakeside' },
  'Chitwan Sauraha': { latitude: 27.5804, longitude: 84.4981, name: 'Chitwan National Park (Sauraha)' },
  'Manakamana': { latitude: 27.9042, longitude: 84.5843, name: 'Manakamana Cable Car Station' },
};

interface EmbeddedMapViewProps {
  pickupLocation?: string;
  dropoffLocation?: string;
  onSelectPickup: (locationName: string, coords?: { lat: number; lng: number }) => void;
  onSelectDropoff: (locationName: string, coords?: { lat: number; lng: number }) => void;
}

export function EmbeddedMapView({
  pickupLocation,
  dropoffLocation,
  onSelectPickup,
  onSelectDropoff,
}: EmbeddedMapViewProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const webViewRef = useRef<WebView>(null);

  const [activeMode, setActiveMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

  // Match current input strings to coordinates or fallback to Kathmandu center
  const pickupCoord = useMemo(() => {
    if (!pickupLocation) return { lat: 27.7154, lng: 85.3123, name: 'Thamel' };
    const matchedKey = Object.keys(FAMOUS_NEPAL_COORDINATES).find((k) =>
      pickupLocation.toLowerCase().includes(k.toLowerCase()),
    );
    if (matchedKey) {
      const c = FAMOUS_NEPAL_COORDINATES[matchedKey];
      return { lat: c.latitude, lng: c.longitude, name: c.name };
    }
    return { lat: 27.7154, lng: 85.3123, name: pickupLocation };
  }, [pickupLocation]);

  const dropoffCoord = useMemo(() => {
    if (!dropoffLocation) return { lat: 28.2096, lng: 83.9595, name: 'Pokhara Lakeside' };
    const matchedKey = Object.keys(FAMOUS_NEPAL_COORDINATES).find((k) =>
      dropoffLocation.toLowerCase().includes(k.toLowerCase()),
    );
    if (matchedKey) {
      const c = FAMOUS_NEPAL_COORDINATES[matchedKey];
      return { lat: c.latitude, lng: c.longitude, name: c.name };
    }
    return { lat: 28.2096, lng: 83.9595, name: dropoffLocation };
  }, [dropoffLocation]);

  // Generate self-contained Leaflet HTML Map with CartoDB Voyager / Dark tiles
  const mapHtml = useMemo(() => {
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${isDark ? '#090D16' : '#F1F5F9'}; }
          .leaflet-control-attribution { display: none !important; }
          .custom-pin-pickup {
            background-color: #059669;
            border: 2px solid #FFFFFF;
            width: 24px;
            height: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFF;
            font-size: 11px;
            font-weight: bold;
          }
          .custom-pin-dropoff {
            background-color: #D97706;
            border: 2px solid #FFFFFF;
            width: 24px;
            height: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFF;
            font-size: 11px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([27.7172, 85.3240], 8);
          L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

          var pickupMarker = null;
          var dropoffMarker = null;
          var routePolyline = null;
          var currentMode = '${activeMode}';

          function createIcon(type) {
            return L.divIcon({
              className: type === 'pickup' ? 'custom-pin-pickup' : 'custom-pin-dropoff',
              html: type === 'pickup' ? '📍' : '🏁',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
          }

          function setPickup(lat, lng, name) {
            if (pickupMarker) map.removeLayer(pickupMarker);
            pickupMarker = L.marker([lat, lng], { icon: createIcon('pickup'), draggable: true }).addTo(map);
            pickupMarker.bindPopup('<b>Pickup:</b> ' + name).openPopup();
            pickupMarker.on('dragend', function(e) {
              var pos = e.target.getLatLng();
              sendMessage({ type: 'PIN_DRAGGED', mode: 'pickup', lat: pos.lat, lng: pos.lng });
            });
            updateRoute();
          }

          function setDropoff(lat, lng, name) {
            if (dropoffMarker) map.removeLayer(dropoffMarker);
            dropoffMarker = L.marker([lat, lng], { icon: createIcon('dropoff'), draggable: true }).addTo(map);
            dropoffMarker.bindPopup('<b>Destination:</b> ' + name).openPopup();
            dropoffMarker.on('dragend', function(e) {
              var pos = e.target.getLatLng();
              sendMessage({ type: 'PIN_DRAGGED', mode: 'dropoff', lat: pos.lat, lng: pos.lng });
            });
            updateRoute();
          }

          function updateRoute() {
            if (routePolyline) map.removeLayer(routePolyline);
            if (pickupMarker && dropoffMarker) {
              var p1 = pickupMarker.getLatLng();
              var p2 = dropoffMarker.getLatLng();
              routePolyline = L.polyline([p1, p2], {
                color: '${colors.accent}',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.85
              }).addTo(map);
              map.fitBounds([p1, p2], { padding: [40, 40] });
            }
          }

          function sendMessage(data) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } else if (window.parent) {
              window.parent.postMessage(JSON.stringify(data), '*');
            }
          }

          map.on('click', function(e) {
            sendMessage({
              type: 'MAP_CLICKED',
              mode: currentMode,
              lat: e.latlng.lat,
              lng: e.latlng.lng
            });
          });

          window.flyToLocation = function(lat, lng, zoom) {
            map.flyTo([lat, lng], zoom || 13, { duration: 1.2 });
          };

          window.setMode = function(mode) {
            currentMode = mode;
          };

          window.zoomIn = function() { map.zoomIn(); };
          window.zoomOut = function() { map.zoomOut(); };

          // Initial placements
          setPickup(${pickupCoord.lat}, ${pickupCoord.lng}, "${pickupCoord.name}");
          setDropoff(${dropoffCoord.lat}, ${dropoffCoord.lng}, "${dropoffCoord.name}");

          setTimeout(function() {
            sendMessage({ type: 'MAP_READY' });
          }, 300);
        </script>
      </body>
      </html>
    `;
  }, [colors.accent, dropoffCoord.lat, dropoffCoord.lng, dropoffCoord.name, isDark, pickupCoord.lat, pickupCoord.lng, pickupCoord.name, activeMode]);

  // Handle messages from the interactive map canvas
  const handleMapMessage = (event: any) => {
    try {
      const rawData = typeof event.nativeEvent?.data === 'string'
        ? event.nativeEvent.data
        : (event.data || '{}');
      const data = JSON.parse(rawData);

      if (data.type === 'MAP_READY') {
        setMapLoaded(true);
      }

      if (data.type === 'MAP_CLICKED' || data.type === 'PIN_DRAGGED') {
        hapticFeedback.selection();
        const roundedLat = data.lat.toFixed(4);
        const roundedLng = data.lng.toFixed(4);

        // Find nearest known Nepal landmark or format with coordinates
        let detectedName = `Pinned Location (${roundedLat}, ${roundedLng})`;
        for (const [name, coord] of Object.entries(FAMOUS_NEPAL_COORDINATES)) {
          const dist = Math.sqrt(
            Math.pow(coord.latitude - data.lat, 2) + Math.pow(coord.longitude - data.lng, 2),
          );
          if (dist < 0.05) {
            detectedName = coord.name;
            break;
          }
        }

        if (data.mode === 'pickup') {
          onSelectPickup(detectedName, { lat: data.lat, lng: data.lng });
        } else {
          onSelectDropoff(detectedName, { lat: data.lat, lng: data.lng });
        }
      }
    } catch {
      // Ignore unparseable post messages
    }
  };

  const handleFlyToPreset = (key: string) => {
    hapticFeedback.selection();
    const hub = FAMOUS_NEPAL_COORDINATES[key];
    if (!hub) return;

    if (activeMode === 'pickup') {
      onSelectPickup(hub.name, { lat: hub.latitude, lng: hub.longitude });
    } else {
      onSelectDropoff(hub.name, { lat: hub.latitude, lng: hub.longitude });
    }

    const script = `window.flyToLocation(${hub.latitude}, ${hub.longitude}, 13);`;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleGetCurrentLocation = async () => {
    hapticFeedback.medium();
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        const name = `My Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        if (activeMode === 'pickup') {
          onSelectPickup(name, { lat, lng });
        } else {
          onSelectDropoff(name, { lat, lng });
        }

        const script = `window.flyToLocation(${lat}, ${lng}, 14);`;
        webViewRef.current?.injectJavaScript(script);
      }
    } catch (e) {
      console.warn('[EmbeddedMap] GPS locate error:', e);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Control Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.modeToggleGroup}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveMode('pickup');
              webViewRef.current?.injectJavaScript(`window.setMode('pickup');`);
            }}
            style={[styles.modeBtn, activeMode === 'pickup' && styles.modeBtnPickupActive]}
          >
            <MapPin size={13} color={activeMode === 'pickup' ? '#FFF' : colors.success} />
            <Text style={[styles.modeBtnText, activeMode === 'pickup' && styles.modeBtnTextActive]}>
              Pickup Pin 📍
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveMode('dropoff');
              webViewRef.current?.injectJavaScript(`window.setMode('dropoff');`);
            }}
            style={[styles.modeBtn, activeMode === 'dropoff' && styles.modeBtnDropoffActive]}
          >
            <Navigation size={13} color={activeMode === 'dropoff' ? '#FFF' : colors.accent} />
            <Text style={[styles.modeBtnText, activeMode === 'dropoff' && styles.modeBtnTextActive]}>
              Destination Pin 🏁
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleGetCurrentLocation}
          style={styles.gpsBtn}
          accessibilityLabel="Locate current position"
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Crosshair size={16} color={colors.accent} />
          )}
        </Pressable>
      </View>

      {/* Embedded Real Map Canvas */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // Web Fallback: Direct responsive HTML iframe
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            title="Embedded Nepal Route Map"
          />
        ) : (
          // Native iOS / Android WebView
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webView}
            onMessage={handleMapMessage}
            scrollEnabled={false}
            nestedScrollEnabled
            javaScriptEnabled
            domStorageEnabled
          />
        )}

        {/* Map Float Controls */}
        <View style={styles.mapFloatControls}>
          <Pressable
            style={styles.floatBtn}
            onPress={() => {
              hapticFeedback.light();
              webViewRef.current?.injectJavaScript('window.zoomIn();');
            }}
          >
            <Plus size={14} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.floatBtn}
            onPress={() => {
              hapticFeedback.light();
              webViewRef.current?.injectJavaScript('window.zoomOut();');
            }}
          >
            <Minus size={14} color={colors.text} />
          </Pressable>
        </View>

        {/* Instruction Badge */}
        <View style={styles.hintOverlay}>
          <Text style={styles.hintText}>
            Tap anywhere on the map or drag pins to set {activeMode === 'pickup' ? 'Pickup 📍' : 'Destination 🏁'}
          </Text>
        </View>
      </View>

      {/* Quick Fly-To Nepal Landmarks */}
      <View style={styles.landmarkBar}>
        <Text style={styles.landmarkLabel}>Quick Nepal Landmarks:</Text>
        <View style={styles.landmarkChips}>
          {Object.keys(FAMOUS_NEPAL_COORDINATES).map((key) => (
            <Pressable
              key={key}
              onPress={() => handleFlyToPreset(key)}
              style={styles.landmarkChip}
            >
              <Text style={styles.landmarkChipText}>{key}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    topControlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modeToggleGroup: {
      flexDirection: 'row',
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 2,
    },
    modeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    modeBtnPickupActive: {
      backgroundColor: colors.success,
    },
    modeBtnDropoffActive: {
      backgroundColor: colors.accent,
    },
    modeBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
    },
    modeBtnTextActive: {
      color: '#FFFFFF',
    },
    gpsBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapContainer: {
      height: 240,
      width: '100%',
      position: 'relative',
      backgroundColor: colors.elevated,
    },
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    mapFloatControls: {
      position: 'absolute',
      right: spacing.sm,
      top: spacing.sm,
      gap: 4,
      zIndex: 10,
    },
    floatBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    hintOverlay: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      right: 8,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    hintText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    landmarkBar: {
      padding: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.elevated,
      gap: 4,
    },
    landmarkLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
      marginLeft: 2,
    },
    landmarkChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    landmarkChip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    landmarkChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
