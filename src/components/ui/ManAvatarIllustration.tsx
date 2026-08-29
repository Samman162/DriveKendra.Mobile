import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, ClipPath, G, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
};

export function ManAvatarIllustration({ size = 100 }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id="avatarCircleClip">
            <Circle cx="50" cy="50" r="50" />
          </ClipPath>
        </Defs>

        {/* Outer Circular Container */}
        <G clipPath="url(#avatarCircleClip)">
          {/* Light Gray Circular Background */}
          <Rect width="100" height="100" fill="#E2E8F0" />

          {/* Shoulders / Black Shirt */}
          <Path
            d="M 12 100 C 12 75, 28 68, 50 68 C 72 68, 88 75, 88 100 Z"
            fill="#0F172A"
          />

          {/* Neck */}
          <Rect x="44" y="55" width="12" height="16" fill="#FFFFFF" rx="3" />

          {/* Ears */}
          <Circle cx="32" cy="46" r="4.5" fill="#FFFFFF" />
          <Circle cx="68" cy="46" r="4.5" fill="#FFFFFF" />

          {/* Face Base */}
          <Circle cx="50" cy="45" r="18" fill="#FFFFFF" />

          {/* Eyes */}
          <Circle cx="43" cy="44" r="2.2" fill="#0F172A" />
          <Circle cx="57" cy="44" r="2.2" fill="#0F172A" />

          {/* Cheerful Smile */}
          <Path
            d="M 44 51 Q 50 58 56 51"
            fill="#0F172A"
          />

          {/* Hair */}
          {/* Top hair with sideburns and stylish crest */}
          <Path
            d="M 32 44 C 32 30, 40 22, 50 22 C 52 18, 55 16, 56 16 C 54 20, 56 22, 60 23 C 67 25, 68 32, 68 44 C 68 36, 65 30, 60 30 C 55 30, 52 33, 47 31 C 41 29, 36 33, 32 44 Z"
            fill="#0F172A"
          />
        </G>
      </Svg>
    </View>
  );
}
