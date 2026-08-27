import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface IllustrationProps {
  size?: number;
}

/**
 * Slide 1: Welcome & Vehicle Rental Booking
 * Exactly replicates the screenshot with hand holding phone booking a car in front of city buildings.
 */
export function BookingIllustration({ size = 280 }: IllustrationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <LinearGradient id="bgGrad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFF2E8" />
            <Stop offset="100%" stopColor="#FFE0CC" />
          </LinearGradient>
          <LinearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF7A1A" />
            <Stop offset="100%" stopColor="#EA580C" />
          </LinearGradient>
          <LinearGradient id="carGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
        </Defs>

        {/* Big Backdrop Circle */}
        <Circle cx="150" cy="150" r="138" fill="url(#bgGrad1)" />

        {/* City Skyline Silhouette */}
        <G opacity={0.65}>
          {/* Building Left */}
          <Rect x="55" y="105" width="42" height="100" rx="4" fill="#FFC9A8" />
          <Rect x="63" y="118" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="73" y="118" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="83" y="118" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="63" y="132" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="73" y="132" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="83" y="132" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="63" y="146" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="73" y="146" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="83" y="146" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />

          {/* Building Center-Left (Tall) */}
          <Rect x="105" y="75" width="46" height="130" rx="4" fill="#FFB990" />
          <Rect x="115" y="90" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="130" y="90" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="115" y="106" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="130" y="106" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="115" y="122" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="130" y="122" width="8" height="10" rx="1" fill="#FFFFFF" opacity={0.7} />

          {/* Building Center-Right */}
          <Rect x="156" y="98" width="40" height="110" rx="4" fill="#FFC9A8" />
          <Rect x="166" y="112" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="178" y="112" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="166" y="126" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="178" y="126" width="6" height="8" rx="1" fill="#FFFFFF" opacity={0.7} />

          {/* Building Right */}
          <Rect x="200" y="80" width="48" height="125" rx="4" fill="#FFD1B5" />
          <Rect x="210" y="94" width="7" height="9" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="225" y="94" width="7" height="9" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="210" y="110" width="7" height="9" rx="1" fill="#FFFFFF" opacity={0.7} />
          <Rect x="225" y="110" width="7" height="9" rx="1" fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* Ambient Floating Clouds & Light Circles */}
        <Circle cx="70" cy="75" r="8" fill="#FFFFFF" opacity={0.8} />
        <Circle cx="82" cy="72" r="12" fill="#FFFFFF" opacity={0.8} />
        <Circle cx="95" cy="76" r="7" fill="#FFFFFF" opacity={0.8} />
        <Circle cx="218" cy="72" r="7" fill="#FFFFFF" opacity={0.7} />
        <Circle cx="228" cy="68" r="10" fill="#FFFFFF" opacity={0.7} />
        <Circle cx="166" cy="195" r="4" fill="#FFFFFF" opacity={0.9} />

        {/* Orange Curved Road Highway */}
        <Path
          d="M 32 178 C 80 162, 140 186, 268 180 C 275 180, 275 194, 268 194 C 140 200, 80 180, 32 194 Z"
          fill="#FB923C"
          opacity={0.85}
        />
        <Path
          d="M 188 202 C 220 202, 252 202, 278 202"
          stroke="#FB923C"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Yellow/Orange Rental Car */}
        <G>
          {/* Car Body */}
          <Path
            d="M 160 170 C 160 164, 168 150, 180 146 L 210 146 C 218 146, 226 154, 230 160 L 235 168 C 238 168, 240 170, 240 174 L 240 182 C 240 184, 238 186, 236 186 L 158 186 C 156 186, 154 184, 154 182 L 154 174 C 154 170, 156 170, 160 170 Z"
            fill="url(#carGrad)"
          />
          {/* Car Windows (Cyan/Sky) */}
          <Path
            d="M 178 152 L 194 152 L 194 166 L 168 166 C 172 158, 175 154, 178 152 Z"
            fill="#BAE6FD"
          />
          <Path
            d="M 198 152 L 210 152 C 215 152, 220 158, 224 166 L 198 166 Z"
            fill="#BAE6FD"
          />
          {/* Car Wheels */}
          <Circle cx="174" cy="186" r="9" fill="#1E293B" />
          <Circle cx="174" cy="186" r="4" fill="#94A3B8" />
          <Circle cx="220" cy="186" r="9" fill="#1E293B" />
          <Circle cx="220" cy="186" r="4" fill="#94A3B8" />
          {/* Headlights */}
          <Rect x="236" y="172" width="4" height="4" rx="1" fill="#FEF08A" />
        </G>

        {/* Hand & Smartphone Foreground */}
        <G>
          {/* Suit Sleeve (Navy) */}
          <Path d="M 55 260 L 105 200 L 126 218 L 76 278 Z" fill="#334155" />
          {/* Shirt Cuff (White) */}
          <Path d="M 98 208 L 108 196 L 124 210 L 114 222 Z" fill="#FFFFFF" />
          {/* Hand Wrist & Palm (Skin tone) */}
          <Path
            d="M 104 200 C 104 185, 110 155, 120 140 C 122 136, 128 136, 130 142 L 140 175 L 144 195 L 120 216 Z"
            fill="#F4C7A1"
          />
          {/* Thumb Holding Phone */}
          <Path
            d="M 98 170 C 98 160, 115 160, 122 165 C 128 170, 128 180, 122 186 C 114 192, 100 182, 98 170 Z"
            fill="#F4C7A1"
          />

          {/* Smartphone Frame */}
          <Rect
            x="98"
            y="108"
            width="48"
            height="84"
            rx="8"
            fill="url(#phoneGrad)"
            stroke="#EA580C"
            strokeWidth="1.5"
          />
          {/* Phone Screen Speaker & Notch */}
          <Rect x="116" y="113" width="12" height="2.5" rx="1.2" fill="#FFFFFF" opacity={0.6} />

          {/* App UI on Phone Screen */}
          {/* Circle Avatar with Car Icon */}
          <Circle cx="122" cy="132" r="10" fill="#FFFFFF" />
          <Path
            d="M 116 134 C 116 132, 119 128, 122 128 C 125 128, 128 132, 128 134 L 128 136 L 116 136 Z"
            fill="#EA580C"
          />
          <Circle cx="118.5" cy="135.5" r="1.2" fill="#FFFFFF" />
          <Circle cx="125.5" cy="135.5" r="1.2" fill="#FFFFFF" />

          {/* UI Info Bar Lines */}
          <Rect x="108" y="146" width="28" height="2" rx="1" fill="#FFFFFF" opacity={0.9} />
          <Rect x="112" y="151" width="20" height="2" rx="1" fill="#FFFFFF" opacity={0.7} />

          {/* Call/Booking Action Icon */}
          <Path
            d="M 112 162 C 112 159, 115 158, 117 160 L 118 162 C 119 163, 119 164, 118 165 C 117 166, 116 167, 117 168 C 118 170, 120 172, 122 173 C 123 174, 124 173, 125 172 C 126 171, 127 171, 128 172 L 130 173 C 132 175, 131 178, 128 178 C 122 178, 112 168, 112 162 Z"
            fill="#FFFFFF"
          />
          <Circle cx="124" cy="164" r="1" fill="#FFFFFF" />
          <Circle cx="127" cy="164" r="1" fill="#FFFFFF" />
          <Circle cx="130" cy="164" r="1" fill="#FFFFFF" />

          {/* Fingers Wrapping Screen */}
          <Path
            d="M 140 148 C 148 148, 148 158, 140 158 Z"
            fill="#E5B887"
          />
          <Path
            d="M 140 160 C 148 160, 148 170, 140 170 Z"
            fill="#E5B887"
          />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Slide 2: Mountain Expeditions & Tour Packages
 * Illustrates snow-capped Himalayan peaks, winding mountain pass, and heavy-duty 4WD tour vehicle.
 */
export function MountainTourIllustration({ size = 280 }: IllustrationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <LinearGradient id="bgGrad2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#EFF6FF" />
            <Stop offset="100%" stopColor="#DBEAFE" />
          </LinearGradient>
          <LinearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#94A3B8" />
            <Stop offset="100%" stopColor="#64748B" />
          </LinearGradient>
          <LinearGradient id="suvGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FF7A1A" />
            <Stop offset="100%" stopColor="#EA580C" />
          </LinearGradient>
        </Defs>

        {/* Big Backdrop Circle */}
        <Circle cx="150" cy="150" r="138" fill="url(#bgGrad2)" />

        {/* Golden Himalayan Sun */}
        <Circle cx="215" cy="85" r="24" fill="#FBBF24" opacity={0.85} />

        {/* Background Mountain Peaks */}
        <Path d="M 40 190 L 110 90 L 180 190 Z" fill="url(#peakGrad)" opacity={0.7} />
        {/* Snow Cap 1 */}
        <Path d="M 110 90 L 92 116 L 102 120 L 110 114 L 118 122 L 128 116 Z" fill="#FFFFFF" />

        {/* Main Prominent Peak (Machhapuchhre / Everest shape) */}
        <Path d="M 110 200 L 185 70 L 260 200 Z" fill="url(#peakGrad)" />
        {/* Snow Cap 2 */}
        <Path d="M 185 70 L 160 112 L 175 118 L 185 108 L 195 120 L 210 112 Z" fill="#FFFFFF" />

        {/* Green Pine Foothills */}
        <Path d="M 30 220 Q 90 170 160 200 Q 230 180 270 220 Z" fill="#10B981" opacity={0.85} />

        {/* Winding Mountain Highway */}
        <Path
          d="M 35 240 C 90 200, 140 250, 265 210"
          stroke="#F97316"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 35 240 C 90 200, 140 250, 265 210"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="8,6"
          fill="none"
        />

        {/* 4WD Scorpio SUV */}
        <G transform="translate(105, 175)">
          {/* Chassis */}
          <Path
            d="M 10 32 L 20 14 L 62 14 L 75 24 L 84 26 L 86 36 L 6 36 Z"
            fill="url(#suvGrad)"
          />
          {/* Roof Rack & Expedition Bags */}
          <Rect x="22" y="8" width="38" height="4" rx="1" fill="#334155" />
          <Rect x="25" y="4" width="14" height="5" rx="2" fill="#F59E0B" />
          <Rect x="42" y="3" width="15" height="6" rx="2" fill="#3B82F6" />
          {/* Windows */}
          <Path d="M 22 17 L 38 17 L 38 28 L 16 28 Z" fill="#BAE6FD" />
          <Path d="M 42 17 L 58 17 L 66 26 L 42 26 Z" fill="#BAE6FD" />
          {/* Heavy Offroad Wheels */}
          <Circle cx="24" cy="38" r="11" fill="#0F172A" />
          <Circle cx="24" cy="38" r="5" fill="#E2E8F0" />
          <Circle cx="68" cy="38" r="11" fill="#0F172A" />
          <Circle cx="68" cy="38" r="5" fill="#E2E8F0" />
          {/* Bright Headlights */}
          <Rect x="82" y="28" width="4" height="4" rx="1" fill="#FEF08A" />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Slide 3: Transparent Rates & Offline Digital Vouchers
 * Illustrates official government-rate tariff shield, digital voucher, and checkmark trust seals.
 */
export function TariffVoucherIllustration({ size = 280 }: IllustrationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <LinearGradient id="bgGrad3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" />
            <Stop offset="100%" stopColor="#FDE68A" />
          </LinearGradient>
          <LinearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF7A1A" />
            <Stop offset="100%" stopColor="#EA580C" />
          </LinearGradient>
        </Defs>

        {/* Big Backdrop Circle */}
        <Circle cx="150" cy="150" r="138" fill="url(#bgGrad3)" />

        {/* Ambient Decorative Rings */}
        <Circle cx="150" cy="150" r="115" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,6" fill="none" opacity={0.4} />

        {/* Digital Voucher Document */}
        <G transform="translate(68, 65)">
          {/* Paper Drop Shadow */}
          <Rect x="8" y="8" width="150" height="175" rx="12" fill="#D97706" opacity={0.15} />
          {/* White Voucher Card */}
          <Rect x="0" y="0" width="150" height="175" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Top Brand Banner */}
          <Path d="M 0 12 C 0 5.37, 5.37 0, 12 0 L 138 0 C 144.63 0, 150 5.37, 150 12 L 150 36 L 0 36 Z" fill="url(#shieldGrad)" />
          <Rect x="16" y="14" width="40" height="8" rx="2" fill="#FFFFFF" />
          <Circle cx="132" cy="18" r="5" fill="#FFFFFF" opacity={0.8} />

          {/* Voucher Details Lines */}
          <Rect x="16" y="50" width="70" height="8" rx="2" fill="#0F172A" opacity={0.8} />
          <Rect x="16" y="64" width="118" height="4" rx="2" fill="#94A3B8" opacity={0.5} />
          <Rect x="16" y="74" width="95" height="4" rx="2" fill="#94A3B8" opacity={0.5} />

          {/* Tariff Breakdown Matrix */}
          <Rect x="16" y="88" width="118" height="36" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <Rect x="24" y="96" width="45" height="5" rx="2" fill="#64748B" />
          <Rect x="88" y="96" width="36" height="5" rx="2" fill="#10B981" />
          <Rect x="24" y="108" width="55" height="5" rx="2" fill="#64748B" />
          <Rect x="94" y="108" width="30" height="5" rx="2" fill="#F59E0B" />

          {/* QR Code Simulation */}
          <Rect x="16" y="134" width="30" height="30" rx="4" fill="#F1F5F9" />
          <Rect x="20" y="138" width="8" height="8" fill="#0F172A" />
          <Rect x="34" y="138" width="8" height="8" fill="#0F172A" />
          <Rect x="20" y="152" width="8" height="8" fill="#0F172A" />

          {/* Verified Seal Stamp */}
          <Circle cx="118" cy="149" r="16" fill="#10B981" />
          <Path d="M 111 149 L 116 154 L 126 144" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>

        {/* Foreground Floating Trust Shield */}
        <G transform="translate(178, 140)">
          <Circle cx="30" cy="30" r="34" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="2" />
          <Path
            d="M 30 10 L 48 18 C 48 34, 38 48, 30 52 C 22 48, 12 34, 12 18 Z"
            fill="url(#shieldGrad)"
          />
          <Path
            d="M 24 28 L 28 32 L 36 24"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Slide 4: Fast Delivery & Logistics / Dhuwani Services
 * Illustrates express commercial cargo van, delivery package boxes, and dispatch route pins.
 */
export function LogisticsIllustration({ size = 280 }: IllustrationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <LinearGradient id="bgGrad4" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFF7ED" />
            <Stop offset="100%" stopColor="#FED7AA" />
          </LinearGradient>
          <LinearGradient id="vanGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FF7A1A" />
            <Stop offset="100%" stopColor="#EA580C" />
          </LinearGradient>
          <LinearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        {/* Big Backdrop Circle */}
        <Circle cx="150" cy="150" r="138" fill="url(#bgGrad4)" />

        {/* Speed Wind Lines */}
        <Path d="M 38 145 L 85 145" stroke="#FB923C" strokeWidth="4" strokeLinecap="round" opacity={0.6} />
        <Path d="M 25 160 L 70 160" stroke="#FB923C" strokeWidth="4" strokeLinecap="round" opacity={0.6} />
        <Path d="M 45 175 L 80 175" stroke="#FB923C" strokeWidth="4" strokeLinecap="round" opacity={0.6} />

        {/* Highway Asphalt */}
        <Path
          d="M 30 220 C 100 210, 180 210, 270 220"
          stroke="#F97316"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />

        {/* Express Logistics Van */}
        <G transform="translate(68, 120)">
          {/* Main Cargo Body */}
          <Path
            d="M 10 24 C 10 16, 16 10, 24 10 L 98 10 C 104 10, 110 14, 114 20 L 126 38 C 128 41, 130 44, 134 44 L 142 44 C 146 44, 150 48, 150 52 L 150 68 C 150 72, 146 76, 142 76 L 10 76 Z"
            fill="url(#vanGrad)"
          />
          {/* Cabin Windshield */}
          <Path d="M 112 24 L 124 38 L 98 38 L 98 24 Z" fill="#BAE6FD" />
          {/* Van Side Speed Decal */}
          <Path d="M 22 42 L 85 42 L 78 52 L 15 52 Z" fill="#FFFFFF" opacity={0.9} />
          {/* Drive Kendra 'TK' Emblem inside Decal */}
          <Circle cx="35" cy="47" r="4" fill="#EA580C" />

          {/* Heavy Duty Wheels */}
          <Circle cx="36" cy="76" r="14" fill="#0F172A" />
          <Circle cx="36" cy="76" r="6" fill="#94A3B8" />
          <Circle cx="120" cy="76" r="14" fill="#0F172A" />
          <Circle cx="120" cy="76" r="6" fill="#94A3B8" />

          {/* Headlights */}
          <Rect x="146" y="56" width="4" height="6" rx="1" fill="#FEF08A" />
        </G>

        {/* Floating Cargo Delivery Parcel Box */}
        <G transform="translate(200, 75)">
          <Rect x="0" y="0" width="42" height="42" rx="6" fill="url(#boxGrad)" stroke="#B45309" strokeWidth="1" />
          {/* Parcel Packing Tape */}
          <Rect x="16" y="0" width="10" height="42" fill="#FEF3C7" opacity={0.8} />
          <Rect x="0" y="16" width="42" height="10" fill="#FEF3C7" opacity={0.8} />
          {/* Delivery Label */}
          <Rect x="6" y="6" width="12" height="8" rx="1" fill="#FFFFFF" />
        </G>

        {/* Floating Dispatch Location Pin */}
        <G transform="translate(225, 142)">
          <Path
            d="M 18 0 C 8 0, 0 8, 0 18 C 0 28, 18 48, 18 48 C 18 48, 36 28, 36 18 C 36 8, 28 0, 18 0 Z"
            fill="#EF4444"
          />
          <Circle cx="18" cy="18" r="7" fill="#FFFFFF" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
