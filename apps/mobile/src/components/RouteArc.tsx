import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';
import { Colors, Font } from '../theme';

interface City { name: string; alt: number; }

interface RouteArcProps {
  origin: City;
  dest: City;
  height?: number;
  showAlt?: boolean;
}

export function RouteArc({ origin, dest, height = 110, showAlt = true }: RouteArcProps) {
  const h = height;
  return (
    <View style={{ height, width: '100%', position: 'relative' }}>
      <Svg width="100%" height={h} viewBox={`0 0 300 ${h}`} preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <LinearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor={Colors.bright} stopOpacity="0.3"/>
            <Stop offset="0.5" stopColor={Colors.bright} stopOpacity="1"/>
            <Stop offset="1" stopColor={Colors.bright} stopOpacity="0.3"/>
          </LinearGradient>
        </Defs>
        <Path
          d={`M 30 ${h - 18} Q 150 ${h * 0.2} 270 ${h - 18}`}
          stroke="url(#arcGrad)" strokeWidth="1.5" fill="none"
          strokeDasharray="3 4" strokeLinecap="round"
        />
        {/* Origin dot */}
        <Circle cx="30" cy={h - 18} r="5" fill={Colors.primary}/>
        <Circle cx="30" cy={h - 18} r="10" fill="none" stroke={Colors.primary} strokeOpacity="0.25" strokeWidth="1"/>
        {/* Dest dot */}
        <Circle cx="270" cy={h - 18} r="5" fill={Colors.coral}/>
        <Circle cx="270" cy={h - 18} r="10" fill="none" stroke={Colors.coral} strokeOpacity="0.3" strokeWidth="1"/>
        {/* Plane glyph at midpoint */}
        <G transform={`translate(150, ${h * 0.28}) rotate(0)`}>
          <Path d="M-8 0l16-5-3 5 3 5-16-5z" fill={Colors.ink}/>
        </G>
      </Svg>
      {/* Labels */}
      <View style={{ position: 'absolute', left: 8, bottom: 0 }}>
        <Text style={{ fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.8, textTransform: 'uppercase' }}>From</Text>
        <Text style={{ fontSize: 16, color: Colors.ink, fontWeight: '500' }}>{origin.name}</Text>
        {showAlt && <Text style={{ fontSize: 10, color: Colors.inkFaint }}>{origin.alt} m</Text>}
      </View>
      <View style={{ position: 'absolute', right: 8, bottom: 0, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.8, textTransform: 'uppercase' }}>To</Text>
        <Text style={{ fontSize: 16, color: Colors.ink, fontWeight: '500' }}>{dest.name}</Text>
        {showAlt && <Text style={{ fontSize: 10, color: Colors.inkFaint }}>{dest.alt} m</Text>}
      </View>
    </View>
  );
}

interface ElevationChartProps {
  originAlt: number;
  destAlt: number;
  height?: number;
}

export function ElevationChart({ originAlt, destAlt, height = 64 }: ElevationChartProps) {
  const maxAlt = Math.max(originAlt, destAlt, 100);
  const hO = (originAlt / maxAlt) * (height - 20) + 12;
  const hD = (destAlt / maxAlt) * (height - 20) + 12;
  const h = height;
  return (
    <Svg width="100%" height={h} viewBox={`0 0 300 ${h}`} preserveAspectRatio="none">
      <Path
        d={`M0 ${h} L0 ${h - hO} Q 150 ${h - (hO + hD) / 2 - 30} 300 ${h - hD} L 300 ${h} Z`}
        fill={Colors.tealSoft} opacity="0.8"
      />
      <Path
        d={`M0 ${h - hO} Q 150 ${h - (hO + hD) / 2 - 30} 300 ${h - hD}`}
        stroke={Colors.primary} strokeWidth="1.5" fill="none"
      />
      <Circle cx="0" cy={h - hO} r="4" fill={Colors.primary}/>
      <Circle cx="300" cy={h - hD} r="4" fill={Colors.coral}/>
    </Svg>
  );
}
