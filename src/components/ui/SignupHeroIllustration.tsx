import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';

interface SignupHeroIllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SignupHeroIllustration({
  width = 240,
  height = 180,
  style,
  testID = 'signup-hero-illustration',
}: SignupHeroIllustrationProps) {
  const { isDark } = useTheme();

  return (
    <View testID={testID} style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 260 200">
        <Defs>
          <LinearGradient id="signupCardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#1E293B' : '#FFFFFF'} />
            <Stop offset="100%" stopColor={isDark ? '#0F172A' : '#FFF5EE'} />
          </LinearGradient>
          <LinearGradient id="signupAccentGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF8533" />
            <Stop offset="100%" stopColor="#FF6B00" />
          </LinearGradient>
          <LinearGradient id="signupAvatarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFE0CC" />
            <Stop offset="100%" stopColor="#FFC299" />
          </LinearGradient>
        </Defs>

        {/* Ambient base puffs & sparks */}
        <G opacity={0.6}>
          <Circle cx="190" cy="180" r="14" fill="#FFE5D0" />
          <Circle cx="210" cy="175" r="10" fill="#FFEFE2" />
          <Circle cx="175" cy="185" r="8" fill="#FFD2B2" />
          {/* Small spark stars */}
          <Path d="M 230 145 L 232 140 L 234 145 L 239 147 L 234 149 L 232 154 L 230 149 L 225 147 Z" fill="#FFA366" />
          <Path d="M 160 160 L 161 156 L 162 160 L 166 161 L 162 162 L 161 166 L 160 162 L 156 161 Z" fill="#FFA366" />
        </G>

        {/* Smartphone / Signup Card on the right */}
        <G>
          {/* Card Shadow */}
          <Rect x="142" y="16" width="96" height="152" rx="14" fill="#000000" opacity={0.06} />
          {/* Card Body */}
          <Rect
            x="140"
            y="14"
            width="96"
            height="150"
            rx="14"
            fill="url(#signupCardGrad)"
            stroke="#FFB280"
            strokeWidth="1.5"
          />

          {/* Top Notch Pill */}
          <Rect x="176" y="20" width="24" height="3" rx="1.5" fill="#E2E8F0" />

          {/* User Avatar Circle */}
          <Circle
            cx="188"
            cy="46"
            r="19"
            fill="url(#signupAvatarGrad)"
            stroke="#FF8533"
            strokeWidth="1.5"
          />
          {/* Avatar Face & Hair */}
          <Circle cx="188" cy="42" r="7" fill="#FCD34D" />
          <Path d="M 182 39 C 182 35, 194 35, 194 39 C 192 38, 184 38, 182 39 Z" fill="#0F172A" />
          <Path d="M 177 56 C 177 50, 199 50, 199 56 Z" fill="#FF6B00" />

          {/* Input field 1: Form Field with Dots */}
          <Rect
            x="152"
            y="74"
            width="72"
            height="16"
            rx="5"
            fill={isDark ? '#334155' : '#FFFFFF'}
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <Circle cx="162" cy="82" r="2" fill="#FFA366" />
          <Circle cx="172" cy="82" r="2" fill="#FFA366" />
          <Circle cx="182" cy="82" r="2" fill="#FFA366" />
          <Circle cx="192" cy="82" r="2" fill="#FFA366" />
          <Circle cx="202" cy="82" r="2" fill="#FFA366" />
          <Circle cx="212" cy="82" r="2" fill="#FFA366" />

          {/* Input field 2: Form Field with Dots */}
          <Rect
            x="152"
            y="96"
            width="72"
            height="16"
            rx="5"
            fill={isDark ? '#334155' : '#FFFFFF'}
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <Circle cx="162" cy="104" r="2" fill="#FFA366" />
          <Circle cx="172" cy="104" r="2" fill="#FFA366" />
          <Circle cx="182" cy="104" r="2" fill="#FFA366" />
          <Circle cx="192" cy="104" r="2" fill="#FFA366" />
          <Circle cx="202" cy="104" r="2" fill="#FFA366" />
          <Circle cx="212" cy="104" r="2" fill="#FFA366" />

          {/* Mini "Sign Up" Button on card */}
          <Rect x="164" y="122" width="48" height="15" rx="4" fill="url(#signupAccentGrad)" />
          {/* Button Text Representation */}
          <Rect x="174" y="128" width="28" height="3" rx="1.5" fill="#FFFFFF" />
        </G>

        {/* Dashed Loop Connection Arrow */}
        <Path
          d="M 124 48 C 120 28, 142 22, 160 36"
          stroke="#475569"
          strokeWidth="1.5"
          strokeDasharray="3,3"
          fill="none"
        />
        <Path d="M 162 38 L 157 32 L 160 36 L 155 37 Z" fill="#475569" />

        {/* Character on Left */}
        <G>
          {/* Left Leg */}
          <Path
            d="M 76 130 C 76 142, 70 172, 68 180 C 72 182, 80 182, 84 180 C 86 172, 88 142, 88 130 Z"
            fill="#334155"
          />
          {/* Right Leg */}
          <Path
            d="M 94 130 C 94 142, 98 172, 102 180 C 106 182, 114 182, 118 180 C 114 172, 106 142, 106 130 Z"
            fill="#1E293B"
          />

          {/* Left Shoe */}
          <Path
            d="M 64 180 C 60 184, 68 190, 84 186 C 84 182, 78 180, 64 180 Z"
            fill="#FF6B00"
          />
          <Rect x="64" y="184" width="20" height="3" rx="1.5" fill="#FFFFFF" />

          {/* Right Shoe */}
          <Path
            d="M 102 180 C 100 182, 108 190, 124 186 C 124 182, 116 180, 102 180 Z"
            fill="#FF6B00"
          />
          <Rect x="104" y="184" width="20" height="3" rx="1.5" fill="#FFFFFF" />

          {/* Character Torso / Sweater */}
          <Path
            d="M 72 74 C 70 82, 68 120, 72 134 C 84 136, 108 136, 118 134 C 122 120, 120 82, 118 74 Z"
            fill="url(#signupAccentGrad)"
          />

          {/* Head & Neck */}
          <Rect x="90" y="62" width="10" height="14" rx="3" fill="#FCD34D" />
          <Circle cx="95" cy="52" r="14" fill="#FCD34D" />

          {/* Hair */}
          <Path
            d="M 83 48 C 83 38, 107 38, 107 48 C 107 43, 87 40, 83 48 Z"
            fill="#0F172A"
          />
          <Path d="M 83 48 C 81 54, 85 58, 85 58 C 85 52, 87 48, 83 48 Z" fill="#0F172A" />

          {/* Eyes & Smile */}
          <Circle cx="98" cy="50" r="1.5" fill="#0F172A" />
          <Path d="M 94 57 C 96 60, 100 60, 102 57" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Left Arm holding Tablet */}
          <Path
            d="M 74 78 C 70 90, 82 108, 92 110 C 94 104, 88 88, 84 78 Z"
            fill="#FF8533"
          />
          {/* Tablet in hand */}
          <Rect x="92" y="92" width="24" height="30" rx="3" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="1.5" />
          <Circle cx="104" cy="107" r="4" fill="#FF8533" />

          {/* Right Arm pointing up right */}
          <Path
            d="M 116 78 C 122 84, 128 72, 126 60 C 122 62, 120 70, 116 78 Z"
            fill="#FF8533"
          />
          {/* Hand pointing */}
          <Circle cx="126" cy="56" r="4" fill="#FCD34D" />
        </G>
      </Svg>
    </View>
  );
}
