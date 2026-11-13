import { useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Button, Card, Notice, RowInfo, Title } from '../../../src/components/UI';
import { useAuth, isGeneralUser } from '../../../src/lib/auth';
import { checkoutAllowed, request } from '../../../src/lib/api';
import { displayDate, yen } from '../../../src/lib/bookingLogic.js';
import type { ConfirmResponse } from '../../../src/types';
import { C } from '../../../src/theme';
export default function BookingConfirm(){
 const {id,startAt,endAt}=useLocalSearchParams<{id:string;startAt:string;endAt:string}>();const router=useRouter();const{user}=useAuth();
 const [confirm,setConfirm]=useState<ConfirmResponse|null>(null);const[loading,setLoading]=useState(false);const[paying,setPaying]=useState(false);const[error,setError]=useState('');
 const valid=id&&/^\d+$/.test(id)&&startAt&&endAt&&Number.isFinite(new Date(startAt).getTime())&&Number.isFinite(new Date(endAt).getTime())&&new Date(startAt)<new Date(endAt);
 const check=async()=>{
   if(!valid||!user||!isGeneralUser(user.roles))return;
   setLoading(true);setError('');setConfirm(null);
   try{
    const data=await request<ConfirmResponse>('/api/reservations/confirm',{method:'POST',body:JSON.stringify({roomId:Number(id),startAt,endAt})},true);
    setConfirm(data);
   }catch(e){setError(e instanceof Error?e.message:'空き状況を確認できませんでした。');}
   finally{setLoading(false);}
 };
 const checkout=async()=>{
   if(!confirm)return;
   if(!checkoutAllowed(confirm.checkoutUrl)){setError('安全なStripe Checkout URLを確認できませんでした。決済を開始しません。');return;}
   setPaying(true);setError('');
   try {
    await WebBrowser.openBrowserAsync(confirm.checkoutUrl);
    Alert.alert('決済画面から戻りました','支払完了はサーバー側で確認されます。予約履歴を更新して状態を確認してください。',[
      {text:'予約履歴を開く',onPress:()=>router.replace('/(tabs)/reservations')},
      {text:'閉じる',style:'cancel'},
    ]);
   }catch(e){setError(e instanceof Error?e.message:'ブラウザを開けませんでした。');}
   finally{setPaying(false);}
 };
 return <ScrollView style={{backgroundColor:C.background}} contentContainerStyle={{padding:19,gap:17,paddingBottom:35}}>
  <Title eyebrow="CONFIRM & CHECKOUT" title="予約内容を確認" subtitle="空き状況と料金はバックエンドで確認・算出します。"/>
  <Card><RowInfo label="開始日時" value={startAt?displayDate(startAt):'―'}/><RowInfo label="終了日時" value={endAt?displayDate(endAt):'―'}/></Card>
  {!valid&&<Notice error>予約日時の指定が正しくありません。スタジオ画面から入力し直してください。</Notice>}
  {!user&&<><Notice>ログインしてから予約確認を行ってください。</Notice><Button title="ログインへ" secondary onPress={()=>router.push('/login')}/></>}
  {user&&!isGeneralUser(user.roles)&&<Notice error>一般会員のみ予約できます。</Notice>}
  {error&&<Notice error>{error}</Notice>}
  {!confirm&&<Button title="空き状況と料金を確認" onPress={check} loading={loading} disabled={!valid||!user||!isGeneralUser(user?.roles)}/>}
  {confirm&&<>
   <Card><Text style={{fontSize:18,fontWeight:'800',color:C.ink}}>{confirm.roomName}</Text><RowInfo label="利用時間" value={`${confirm.hours} 時間`}/>{confirm.items?.map((item,i)=><RowInfo key={`${item.label}-${i}`} label={item.label} value={yen(item.amount)}/>)}<RowInfo label="利用料金小計" value={yen(confirm.subtotal)}/><RowInfo label={`消費税（${confirm.taxRatePercent}%）`} value={yen(confirm.tax)}/><RowInfo label={`手数料（${confirm.platformFeeRatePercent}%）`} value={yen(confirm.platformFee)}/><View style={{marginTop:6,borderTopWidth:1,borderColor:C.border,paddingTop:15,flexDirection:'row',justifyContent:'space-between'}}><Text style={{fontSize:16,fontWeight:'800',color:C.ink}}>合計金額</Text><Text style={{fontSize:25,fontWeight:'800',color:C.brand}}>{yen(confirm.amount)}</Text></View></Card>
   <Notice>Stripeの外部決済画面へ遷移します。決済完了はAPIの予約履歴で確認してください。ブラウザを閉じただけでは決済完了になりません。</Notice>
   <Button title="Stripe決済へ進む" onPress={checkout} loading={paying}/>
   <Button title="もう一度空き状況を確認" onPress={check} secondary loading={loading}/>
  </>}
 </ScrollView>;
}
