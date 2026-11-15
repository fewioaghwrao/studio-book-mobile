import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/lib/auth';
import { C } from '../src/theme';
export default function RootLayout() {
 return <AuthProvider>
  <StatusBar style="dark" />
  <Stack screenOptions={{headerStyle:{backgroundColor:C.white},headerTintColor:C.ink,headerTitleStyle:{fontWeight:'700'},contentStyle:{backgroundColor:C.background}}}>
    <Stack.Screen name="(tabs)" options={{headerShown:false}} />
    <Stack.Screen name="rooms/ai-search" options={{title:'AIスタジオ検索'}} />
    <Stack.Screen name="rooms/[id]/index" options={{title:'スタジオ詳細'}} />
    <Stack.Screen name="rooms/[id]/reviews/new" options={{title:'レビューを書く'}} />
    <Stack.Screen name="rooms/[id]/book" options={{title:'予約日時を選択'}} />
    <Stack.Screen name="rooms/[id]/confirm" options={{title:'予約内容の確認'}} />
    <Stack.Screen name="login" options={{title:'ログイン',presentation:'modal'}} />
    <Stack.Screen name="profile-edit" options={{title:'会員情報の変更'}} />
  </Stack>
 </AuthProvider>;
}
