import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Loading, Notice, RowInfo, Title } from '../../src/components/UI';
import { useAuth } from '../../src/lib/auth';
import { C } from '../../src/theme';
export default function Account(){
 const router=useRouter();const{user,ready,refresh,signOut}=useAuth();
 const logout=()=>Alert.alert('ログアウト','ログアウトしますか？',[{text:'戻る',style:'cancel'},{text:'ログアウト',style:'destructive',onPress:async()=>{try{await signOut();}catch(e){Alert.alert('エラー',e instanceof Error?e.message:'ログアウトできませんでした。');}}}]);
 if(!ready)return <Loading/>;
 return <ScrollView style={{backgroundColor:C.background}} contentContainerStyle={{padding:19,paddingBottom:40,gap:16}}>
  <Title eyebrow="MY ACCOUNT" title="マイページ" subtitle="ログイン情報と登録済みの会員情報を確認できます。"/>
  {!user?<><Card><Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>Studio Bookにようこそ</Text><Text style={{color:C.inkMuted,lineHeight:23}}>会員登録済みのアカウントでログインすると、予約履歴やプロフィールを利用できます。</Text><Button title="ログインする" onPress={()=>router.push('/login')}/></Card><Notice>新規登録・パスワード再設定は既存のWeb版をご利用ください。モバイル版では既存会員のログインに対応しています。</Notice></>:
  <><Card><View style={{alignItems:'center',gap:9,paddingVertical:10}}><View style={{width:64,height:64,borderRadius:32,backgroundColor:C.mint,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:29,color:C.brand}}>◉</Text></View><Text style={{color:C.ink,fontSize:22,fontWeight:'800'}}>{user.name}</Text><Text style={{color:C.inkMuted}}>{user.email}</Text></View></Card>
   <Card><Text style={{color:C.ink,fontSize:18,fontWeight:'800'}}>会員情報</Text><RowInfo label="ふりがな" value={user.kana||'―'}/><RowInfo label="メールアドレス" value={user.email}/><RowInfo label="電話番号" value={user.phoneNumber||'―'}/><RowInfo label="郵便番号" value={user.postalCode||'―'}/><RowInfo label="住所" value={user.address||'―'}/><RowInfo label="利用目的" value={user.usageType||'―'}/><RowInfo label="権限" value={(user.roles||[]).join(' / ')}/></Card>
   <Button title="会員情報を編集" onPress={()=>router.push('/profile-edit')}/>
   <Button title="会員情報を更新" secondary onPress={()=>refresh().catch(e=>Alert.alert('更新エラー',e.message))}/>
   <Button title="ログアウト" secondary onPress={logout}/>
  </>}
 </ScrollView>;
}
