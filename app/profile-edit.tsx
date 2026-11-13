import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Notice, Title } from '../src/components/UI';
import { useAuth } from '../src/lib/auth';
import { updateMe } from '../src/lib/api';
import { C } from '../src/theme';
import type { EditMember } from '../src/types';
export default function ProfileEdit(){
 const router=useRouter();const{user,refresh}=useAuth();
 const [form,setForm]=useState<EditMember>({name:'',kana:'',postalCode:'',address:'',phoneNumber:'',email:''});
 const[loading,setLoading]=useState(false);const[error,setError]=useState('');
 useEffect(()=>{if(user)setForm({name:user.name||'',kana:user.kana||'',postalCode:user.postalCode||'',address:user.address||'',phoneNumber:user.phoneNumber||'',email:user.email||''});},[user]);
 const set=(key:keyof EditMember,value:string)=>setForm(f=>({...f,[key]:value}));
 const save=async()=>{
  if(Object.values(form).some(v=>!v.trim())){setError('すべての項目を入力してください。');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setError('メールアドレスの形式を確認してください。');return;}
  setLoading(true);setError('');
  try{await updateMe(form);await refresh();Alert.alert('更新しました','会員情報を保存しました。',[{text:'OK',onPress:()=>router.back()}]);}
  catch(e){setError(e instanceof Error?e.message:'会員情報を更新できませんでした。');}
  finally{setLoading(false);}
 };
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:C.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView contentContainerStyle={{padding:19,paddingBottom:45,gap:16}} keyboardShouldPersistTaps="handled">
   <Title eyebrow="PROFILE" title="会員情報を編集" subtitle="既存APIに会員情報を保存します。"/>
   {!user?<Notice error>ログインが必要です。</Notice>:<Card>
    <Field label="氏名" value={form.name} onChangeText={s=>set('name',s)}/>
    <Field label="フリガナ" value={form.kana} onChangeText={s=>set('kana',s)}/>
    <Field label="郵便番号" value={form.postalCode} onChangeText={s=>set('postalCode',s)} keyboardType="number-pad"/>
    <Field label="住所" value={form.address} onChangeText={s=>set('address',s)}/>
    <Field label="電話番号" value={form.phoneNumber} onChangeText={s=>set('phoneNumber',s)} keyboardType="phone-pad"/>
    <Field label="メールアドレス" value={form.email} onChangeText={s=>set('email',s)} keyboardType="email-address"/>
    {error&&<Notice error>{error}</Notice>}
    <Button title="変更内容を保存" onPress={save} loading={loading}/>
   </Card>}
  </ScrollView>
 </KeyboardAvoidingView>;
}
