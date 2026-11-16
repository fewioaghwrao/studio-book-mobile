import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../src/theme';
import type { ColorValue } from 'react-native';

const Icon = ({
  symbol,
  color,
}: {
  symbol: string;
  color: ColorValue | null;
}) => (
  <Text style={{ fontSize: 21, color: color ?? undefined }}>
    {symbol}
  </Text>
);
export default function TabLayout() {
 return <Tabs screenOptions={{headerStyle:{backgroundColor:C.white},headerTintColor:C.ink,headerTitleStyle:{fontWeight:'800'},tabBarActiveTintColor:C.brand,tabBarInactiveTintColor:'#8E9B96',tabBarStyle:{height:62,paddingTop:5,backgroundColor:C.white,borderTopColor:C.border},tabBarLabelStyle:{fontWeight:'700',fontSize:11,marginBottom:6}}}>
  <Tabs.Screen name="index" options={{title:'スタジオを探す',tabBarLabel:'探す',tabBarIcon:({color})=><Icon symbol="⌕" color={color}/>}} />
  <Tabs.Screen name="reservations" options={{title:'予約履歴',tabBarLabel:'予約',tabBarIcon:({color})=><Icon symbol="▦" color={color}/>}} />
  <Tabs.Screen name="account" options={{title:'マイページ',tabBarLabel:'マイページ',tabBarIcon:({color})=><Icon symbol="◉" color={color}/>}} />
 </Tabs>;
}
