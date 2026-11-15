import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Notice, PasswordField, Title } from '../src/components/UI';
import { useAuth } from '../src/lib/auth';
import { C } from '../src/theme';
export default function Login(){
 const router=useRouter();const{signIn}=useAuth();
 const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[loading,setLoading]=useState(false);const[error,setError]=useState('');
 const submit=async()=>{
  if(!email.trim()||!password){setError('メールアドレスとパスワードを入力してください。');return;}
  setLoading(true);setError('');
  try{await signIn(email,password);if(router.canGoBack())router.back();else router.replace('/(tabs)/account');}
  catch(e){setError(e instanceof Error?e.message:'ログインできませんでした。');}
  finally{setLoading(false);}
 };
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:C.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,paddingTop:43,paddingBottom:50,gap:20}}>
   <View style={{alignItems:'center',gap:12}}><View style={{backgroundColor:C.brandDark,borderRadius:20,padding:15}}><Text style={{color:C.white,fontWeight:'900',fontSize:28}}>SB</Text></View><Text style={{color:C.brand,letterSpacing:3,fontWeight:'800'}}>STUDIO BOOK</Text></View>
   <Title title="おかえりなさい" subtitle="Studio Bookの一般会員アカウントでログインしてください。"/>
   <Card><Field label="メールアドレス" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="example@mail.com"/><PasswordField value={password} onChangeText={setPassword}/>{error&&<Notice error>{error}</Notice>}<Button title="ログイン" onPress={submit} loading={loading}/></Card>
   <Notice>一般会員（GeneralUser）専用です。管理者・ホストのログインはWeb版をご利用ください。</Notice>
  </ScrollView>
 </KeyboardAvoidingView>;
}
