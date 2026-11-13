import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Loading, Notice, RowInfo, Title } from '../../src/components/UI';
import { StudioImage } from '../../src/components/StudioImage';
import { useAuth, isGeneralUser } from '../../src/lib/auth';
import { cancelReservation, cancellationConfig, request } from '../../src/lib/api';
import { displayDate, statusLabel, yen } from '../../src/lib/bookingLogic.js';
import { C } from '../../src/theme';
import type { Reservation, ReservationsResponse } from '../../src/types';
export default function Reservations(){
 const router=useRouter();const{user,ready}=useAuth();
 const [items,setItems]=useState<Reservation[]>([]);const[page,setPage]=useState(1);const[pages,setPages]=useState(1);
 const [loading,setLoading]=useState(false);const[error,setError]=useState('');const[canceling,setCanceling]=useState<number|null>(null);
 const general=isGeneralUser(user?.roles);
 const load=useCallback(async(target=1)=>{
   if(!general)return;
   setLoading(true);setError('');
   try {
    const r=await request<ReservationsResponse>(`/api/reservations?page=${target}&pageSize=10`,{},true);
    setItems(r.items||[]);setPage(r.page||target);setPages(Math.max(1,r.totalPages||1));
   } catch(e){setError(e instanceof Error?e.message:'予約履歴を取得できませんでした。');}
   finally{setLoading(false);}
 },[general]);
 useFocusEffect(useCallback(()=>{load(1);},[load]));
 const askCancel=(r:Reservation)=>{
  Alert.alert('予約をキャンセルしますか？',`${r.roomName}\n${displayDate(r.startAt)}\n返金・取り消し条件はサーバーの規定に従います。`,[
   {text:'戻る',style:'cancel'},
   {text:'キャンセルを確定',style:'destructive',onPress:async()=>{
     setCanceling(r.reservationId);
     try {await cancelReservation(r.reservationId);Alert.alert('完了','予約取消リクエストを受け付けました。');await load(page);}
     catch(e){Alert.alert('キャンセルできませんでした',e instanceof Error?e.message:'APIでエラーが発生しました。');}
     finally{setCanceling(null);}
   }},
  ]);
 };
 if(!ready)return <Loading/>;
 if(!user)return <View style={{padding:19,gap:16}}><Title eyebrow="MY BOOKINGS" title="予約履歴" subtitle="ログインすると予約と支払い状況を確認できます。"/><Button title="ログインする" onPress={()=>router.push('/login')}/></View>;
 if(!general)return <View style={{padding:19}}><Notice error>予約履歴は一般会員（GeneralUser）のみ閲覧できます。</Notice></View>;
 return <FlatList style={{backgroundColor:C.background}} data={items} keyExtractor={i=>String(i.reservationId)}
  refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>load(page)} tintColor={C.brand}/>} 
  ListHeaderComponent={<View style={{padding:18,gap:12}}><Title eyebrow="MY BOOKINGS" title="予約履歴" subtitle="予約済み・決済済み・キャンセル済みの状態を確認できます。"/>{error?<Notice error>{error}</Notice>:null}{!cancellationConfig.supported&&<Notice>キャンセル操作は既存Web版でAPI仕様が確認できないため未接続です。キャンセルAPIを設定すると操作を有効化できます。</Notice>}</View>}
  renderItem={({item:r})=><Card style={{marginHorizontal:18,marginBottom:14,padding:0,overflow:'hidden'}}>
   <StudioImage imageName={r.roomImageName} style={{width:'100%',height:142}}/>
   <View style={{padding:16,gap:10}}>
    <View style={{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'}}><Text style={{fontSize:17,fontWeight:'800',color:C.ink,flex:1}}>{r.roomName}</Text><View style={{backgroundColor:r.status==='canceled'?C.dangerPale:C.mint,borderRadius:30,paddingVertical:7,paddingHorizontal:10}}><Text style={{color:r.status==='canceled'?C.danger:C.brand,fontSize:12,fontWeight:'800'}}>{statusLabel(r.status,r.isUsed)}</Text></View></View>
    <Text style={{color:C.inkMuted,fontSize:12}}>{r.roomAddress}</Text>
    <RowInfo label="開始日時" value={displayDate(r.startAt)}/><RowInfo label="終了日時" value={displayDate(r.endAt)}/><RowInfo label="合計" value={yen(r.amount)}/>
    <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title="スタジオ詳細" secondary onPress={()=>router.push({pathname:'/rooms/[id]',params:{id:String(r.roomId)}})}/></View>{cancellationConfig.supported&&!r.isUsed&&['booked','paid'].includes(r.status)&&<View style={{flex:1}}><Button title="キャンセル" danger loading={canceling===r.reservationId} onPress={()=>askCancel(r)}/></View>}</View>
   </View>
  </Card>}
  ListEmptyComponent={!loading&&!error?<View style={{padding:24,alignItems:'center'}}><Text style={{color:C.inkMuted}}>まだ予約履歴はありません。</Text></View>:loading?<Loading/>:null}
  ListFooterComponent={<View style={{flexDirection:'row',gap:10,padding:18}}>{page>1&&<View style={{flex:1}}><Button title="前へ" secondary onPress={()=>load(page-1)}/></View>}{page<pages&&<View style={{flex:1}}><Button title="次へ" secondary onPress={()=>load(page+1)}/></View>}</View>}
  contentContainerStyle={{paddingBottom:20}}/>;
}
