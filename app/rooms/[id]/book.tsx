import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DateTimeField } from '../../../src/components/DateTimeField';
import { Button, Card, Loading, Notice, RowInfo, Title } from '../../../src/components/UI';
import { useAuth, isGeneralUser } from '../../../src/lib/auth';
import { request } from '../../../src/lib/api';
import { dateError, localDateTime, overlapsEvents, yen } from '../../../src/lib/bookingLogic.js';
import { C } from '../../../src/theme';
import type { RoomDetail } from '../../../src/types';
function futureHour(hours=2) {const d=new Date();d.setMinutes(0,0,0);d.setHours(d.getHours()+hours);return d;}
function withDate(old:Date,newDate:Date) {const d=new Date(old);d.setFullYear(newDate.getFullYear(),newDate.getMonth(),newDate.getDate());return d;}
function withTime(old:Date,newTime:Date) {const d=new Date(old);d.setHours(newTime.getHours(),newTime.getMinutes(),0,0);return d;}
export default function BookingInput(){
 const{id}=useLocalSearchParams<{id:string}>();const router=useRouter();const{user,ready}=useAuth();
 const[room,setRoom]=useState<RoomDetail|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 const[start,setStart]=useState(()=>futureHour(2));const[end,setEnd]=useState(()=>futureHour(3));
 useEffect(()=>{let active=true;request<RoomDetail>(`/api/rooms/${encodeURIComponent(id||'')}`).then(r=>{if(active)setRoom(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
 const validation=dateError(start,end);
 const overlap=room?overlapsEvents(start,end,room.calendarEvents||[]):false;
 const canBook=Boolean(user&&isGeneralUser(user.roles));
 const next=()=>{
  if(!id||validation||overlap)return;
  router.push({pathname:'/rooms/[id]/confirm',params:{id,startAt:localDateTime(start),endAt:localDateTime(end)}});
 };
 return <ScrollView style={{backgroundColor:C.background}} contentContainerStyle={{padding:19,gap:17,paddingBottom:36}} keyboardShouldPersistTaps="handled">
  <Title eyebrow="BOOK A STUDIO" title="利用日時を選択" subtitle="開始・終了日時を選び、サーバーで空き状況と料金を確認します。"/>
  {loading?<Loading/>:error?<Notice error>{error}</Notice>:room&&<>
   <Card><Text style={{fontSize:18,fontWeight:'800',color:C.ink}}>{room.name}</Text><RowInfo label="基本料金" value={`${yen(room.price)} / 時間`}/><RowInfo label="収容人数" value={`${room.capacity}名`}/></Card>
   <Card><Text style={{fontSize:17,fontWeight:'800',color:C.ink}}>利用開始</Text><View style={{gap:12}}><DateTimeField label="開始日" mode="date" value={start} onChange={d=>setStart(withDate(start,d))}/><DateTimeField label="開始時刻" mode="time" value={start} onChange={d=>setStart(withTime(start,d))}/></View></Card>
   <Card><Text style={{fontSize:17,fontWeight:'800',color:C.ink}}>利用終了</Text><View style={{gap:12}}><DateTimeField label="終了日" mode="date" value={end} onChange={d=>setEnd(withDate(end,d))}/><DateTimeField label="終了時刻" mode="time" value={end} onChange={d=>setEnd(withTime(end,d))}/></View></Card>
   {validation?<Notice error>{validation}</Notice>:overlap?<Notice error>選択時間帯に登録済みの予約・休館予定などが重なっています。別の日時をお選びください。</Notice>:<Notice>カレンダー上は既知の重複が見つかっていません。空き状況は次の画面で最終確認します。</Notice>}
   {ready&&!user&&<><Notice>予約するにはログインが必要です。</Notice><Button title="ログインする" secondary onPress={()=>router.push('/login')}/></>}
   {user&&!canBook&&<Notice error>予約は一般会員（GeneralUser）に限られます。</Notice>}
   <Button title="空き状況・料金確認へ" onPress={next} disabled={!canBook||Boolean(validation)||overlap}/>
  </>}
 </ScrollView>;
}
