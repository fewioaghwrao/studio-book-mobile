import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Button, Card, Loading, Notice, RowInfo, Title } from '../../../src/components/UI';
import { StudioImage } from '../../../src/components/StudioImage';
import { request } from '../../../src/lib/api';
import { yen } from '../../../src/lib/bookingLogic.js';
import { RoomCalendar } from '../../../src/components/RoomCalendar';
import { RoomReviews } from '../../../src/components/RoomReviews';
import { C } from '../../../src/theme';
import type { RoomDetail } from '../../../src/types';
const weekdays=['','月','火','水','木','金','土','日'];
export default function StudioDetail(){
 const {id}=useLocalSearchParams<{id:string}>();const router=useRouter();
 const [room,setRoom]=useState<RoomDetail|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 useEffect(()=>{let active=true;setLoading(true);request<RoomDetail>(`/api/rooms/${encodeURIComponent(id||'')}`).then(r=>{if(active)setRoom(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
 return <ScrollView style={{backgroundColor:C.background}} contentContainerStyle={{paddingBottom:35}}>
  <Stack.Screen options={{title:room?.name??'スタジオ詳細'}}/>
  {loading?<Loading/>:error?<View style={{padding:18}}><Notice error>{error}</Notice></View>:room&&<>
   <StudioImage imageName={room.imageName} style={{width:'100%',height:245}}/>
   <View style={{padding:18,gap:18}}>
    <View><Text style={{fontSize:12,fontWeight:'800',color:C.brand,marginBottom:7}}>STUDIO DETAIL</Text><Text style={{fontSize:27,fontWeight:'800',color:C.ink}}>{room.name}</Text><Text style={{color:C.inkMuted,marginTop:8}}>⌖  {room.address}</Text></View>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:24,fontWeight:'800',color:C.brand}}>{yen(room.price)}<Text style={{fontSize:13,fontWeight:'500'}}> / 時間</Text></Text><Text style={{color:C.amber}}>★ {room.averageScore?.toFixed(1)??'-'} ({room.reviewCount}件)</Text></View>
    <Card><Text style={{fontSize:17,fontWeight:'800',color:C.ink}}>スタジオ情報</Text><Text style={{color:C.inkMuted,lineHeight:23}}>{room.description||'説明は登録されていません。'}</Text><RowInfo label="収容人数" value={`${room.capacity}名`}/><RowInfo label="ホスト" value={room.hostName}/><RowInfo label="所在地" value={`${room.postalCode||''} ${room.address}`}/></Card>
    <Card><Text style={{fontSize:17,fontWeight:'800',color:C.ink}}>営業時間</Text>{(room.businessHours||[]).length?room.businessHours.map(h=><RowInfo key={h.dayOfWeek} label={`${weekdays[h.dayOfWeek]||h.dayOfWeek}曜日`} value={h.isHoliday?'定休日':`${h.startTime?.slice(0,5)??'–'} – ${h.endTime?.slice(0,5)??'–'}`}/>):<Text style={{color:C.inkMuted}}>営業時間は登録されていません。</Text>}</Card>
    <RoomCalendar businessHours={room.businessHours||[]} calendarEvents={room.calendarEvents||[]}/>
    <RoomReviews room={room}/>
    <Button title="このスタジオを予約する" onPress={()=>router.push({pathname:'/rooms/[id]/book',params:{id:String(room.id)}})}/>
   </View>
  </>}
 </ScrollView>;
}
