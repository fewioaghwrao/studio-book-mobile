import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Loading, Notice, Title } from '../../../../src/components/UI';
import { StudioImage } from '../../../../src/components/StudioImage';
import { useAuth, isGeneralUser } from '../../../../src/lib/auth';
import { ApiError, request } from '../../../../src/lib/api';
import { displayDate } from '../../../../src/lib/bookingLogic.js';
import { canSubmitReview, reviewError, starText } from '../../../../src/lib/reviewLogic.js';
import { C } from '../../../../src/theme';
import type { AiReviewAssistResponse, ReviewPageResponse } from '../../../../src/types';

export default function ReviewNew(){
  const {id,reservationId}=useLocalSearchParams<{id:string;reservationId?:string}>();
  const router=useRouter();
  const {user,ready,signOut}=useAuth();
  const general=isGeneralUser(user?.roles);
  const [data,setData]=useState<ReviewPageResponse|null>(null);
  const [score,setScore]=useState(5);
  const [content,setContent]=useState('');
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [assisting,setAssisting]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [submitted,setSubmitted]=useState(false);
  const roomId=Number(id);
  const reservationNumber=reservationId?Number(reservationId):null;
  const validRoom=Number.isSafeInteger(roomId)&&roomId>0;
  const validReservation=reservationNumber===null||(Number.isSafeInteger(reservationNumber)&&reservationNumber>0);
  const querySuffix=reservationNumber!==null&&validReservation?`&reservationId=${reservationNumber}`:'';

  const load=useCallback(async(targetPage:number)=>{
    if (!validRoom||!validReservation||!general)return;
    setLoading(true);setError('');
    try{
      const json=await request<ReviewPageResponse>(`/api/rooms/${roomId}/reviews/new?page=${targetPage}&pageSize=10${querySuffix}`,{},true);
      setData(json);setPage(json.page||targetPage);
    }catch(e){
      if(e instanceof ApiError&&e.status===401)await signOut();
      setError(e instanceof Error?e.message:'レビュー情報を取得できませんでした。');
    }finally{setLoading(false);}
  },[roomId,validRoom,validReservation,querySuffix,general,signOut]);
  useFocusEffect(useCallback(()=>{
    if(general){void load(1);}else{setData(null);}
  },[general,load]));

  const assist=async()=>{
    setError('');setNotice('');
    const msg=reviewError(score,content);
    if(msg){setError(msg);return;}
    if(!data?.canReview||submitted){setError('このスタジオへはレビューを投稿できません。');return;}
    setAssisting(true);
    try {
      const response=await request<AiReviewAssistResponse>('/api/ai/review-assist',{
        method:'POST',body:JSON.stringify({content:content.trim(),score,roomName:data.roomName}),
      },true);
      const assisted=response?.assistedContent?.trim();
      if(!assisted){setError('AIレビュー文補助の結果が空でした。');return;}
      if(assisted.length>1000){setError('AIの補助結果が1000文字を超えました。文章を短くして再度お試しください。');return;}
      setContent(assisted);
      setNotice('AIがレビュー文を整えました。内容を確認・修正してから投稿してください。');
    }catch(e){
      if(e instanceof ApiError&&e.status===401)await signOut();
      setError(e instanceof Error?e.message:'AIレビュー文補助に失敗しました。');
    }finally{setAssisting(false);}
  };

  const submit=async()=>{
    setError('');setNotice('');
    const msg=reviewError(score,content);
    if(msg){setError(msg);return;}
    if(!canSubmitReview(data,submitting,assisting)||submitted){setError('レビュー投稿の権限・状態を確認してください。');return;}
    setSubmitting(true);
    try {
      await request<unknown>(`/api/rooms/${roomId}/reviews`,{
        method:'POST',body:JSON.stringify({reservationId:reservationNumber,score,content}),
      },true);
      setSubmitted(true);
      setNotice('レビューを投稿しました。予約履歴へ戻れます。');
      setContent('');
      // 投稿済み状態をAPIから再取得して二重投稿を防止。
      await load(1);
    }catch(e){
      if(e instanceof ApiError&&e.status===401)await signOut();
      setError(e instanceof Error?e.message:'レビュー投稿に失敗しました。');
    }finally{setSubmitting(false);}
  };

  const eligible=canSubmitReview(data,submitting,assisting)&&!submitted;
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:C.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <Stack.Screen options={{title:'レビューを書く'}}/>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:45,gap:16}}>
      <Title eyebrow="WRITE REVIEW" title="レビューを書く" subtitle="利用したスタジオの感想を投稿できます。"/>
      {!validRoom||!validReservation?<Notice error>スタジオIDまたは予約IDが不正です。</Notice>
      :!ready?<Loading/>
      :!general?<Card>
        <Notice>レビューの投稿には一般会員としてのログインが必要です。</Notice>
        <Button title="一般会員としてログイン" onPress={()=>router.push('/login')}/>
      </Card>
      :<>
        {error?<Notice error>{error}</Notice>:null}
        {notice?<Notice>{notice}</Notice>:null}
        {loading&&!data?<Loading label="レビューを読み込み中..."/>:null}
        {data&&<>
          <Card style={{padding:0,overflow:'hidden'}}>
            <StudioImage imageName={data.roomImageName} style={{width:'100%',height:175}}/>
            <View style={{padding:16,gap:8}}>
              <Text style={{fontSize:20,fontWeight:'800',color:C.ink}}>{data.roomName}</Text>
              <Text style={{color:C.inkMuted,fontSize:12}}>{data.roomAddress}</Text>
              <Text style={{color:C.amber,fontSize:17,fontWeight:'800'}}>{starText(data.averageScore)} <Text style={{color:C.ink,fontSize:13}}>{(data.averageScore??0).toFixed(1)} / 5（{data.reviewCount}件）</Text></Text>
            </View>
          </Card>
          {!data.canReview||submitted?<Notice>{submitted||data.alreadyReviewed?'このスタジオへのレビューは投稿済みです。':'レビュー投稿は、利用済みの予約があるユーザーのみ可能です。'}</Notice>:<Card>
            <Text style={{color:C.ink,fontSize:17,fontWeight:'800'}}>評価</Text>
            <View style={{flexDirection:'row',gap:9}}>
              {[1,2,3,4,5].map(n=><Pressable key={n} accessibilityRole="button" accessibilityLabel={`評価${n}点`} accessibilityState={{selected:score===n}}
                onPress={()=>setScore(n)} style={{minHeight:45,justifyContent:'center'}}>
                <Text style={{fontSize:36,color:n<=score?C.amber:'#C7D1CB'}}>★</Text>
              </Pressable>)}
            </View>
            <Text style={{color:C.inkMuted,fontSize:12}}>選択中：{score} / 5</Text>
            <Text style={{color:C.ink,fontSize:17,fontWeight:'800',marginTop:6}}>コメント</Text>
            <TextInput accessibilityLabel="レビューコメント" value={content} onChangeText={setContent} maxLength={1000}
              multiline numberOfLines={6} textAlignVertical="top" placeholder="良かった点、気になった点などを入力してください。"
              placeholderTextColor="#9BA8A2" style={{minHeight:150,borderWidth:1,borderColor:C.border,borderRadius:12,padding:13,color:C.ink,backgroundColor:C.white,fontSize:15,lineHeight:22}}/>
            <Text style={{alignSelf:'flex-end',color:C.inkMuted,fontSize:12}}>{content.length}/1000文字</Text>
            <View style={{backgroundColor:'#EAF4FA',padding:13,borderRadius:13,gap:10}}>
              <Text style={{fontWeight:'800',color:C.ink}}>AIレビュー文補助</Text>
              <Text style={{color:C.inkMuted,fontSize:12,lineHeight:19}}>入力した感想を自然なレビュー文に整えます。AIの文章は参考です。内容を確認してから投稿してください。</Text>
              <Button title={assisting?'AI整文中...':'レビュー文を整える'} secondary loading={assisting} disabled={submitting||!content.trim()} onPress={assist}/>
            </View>
            <Button title={submitting?'投稿中...':'レビューを投稿する'} onPress={submit} disabled={!eligible} loading={submitting}/>
          </Card>}
          <Card>
            <Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>この部屋のレビュー</Text>
            {(data.reviews||[]).length===0?<Text style={{color:C.inkMuted}}>まだレビューはありません。</Text>:(data.reviews||[]).map(item=><View key={item.id} style={{backgroundColor:C.background,borderRadius:12,padding:13,gap:7}}>
              <Text style={{color:C.amber,fontWeight:'800',fontSize:18}}>{starText(item.score)} <Text style={{fontSize:12,color:C.ink}}>{item.score} / 5</Text></Text>
              <Text style={{color:C.ink,fontSize:14,lineHeight:21}}>{item.content}</Text>
              <Text style={{color:C.inkMuted,fontSize:12}}>投稿者：{item.userName||'ユーザー'}　{displayDate(item.createdAtUtc)}</Text>
            </View>)}
            {(data.totalPages||1)>1&&<View style={{flexDirection:'row',alignItems:'center',gap:10,justifyContent:'space-between'}}>
              <View style={{flex:1}}><Button title="前へ" secondary disabled={loading||page<=1} onPress={()=>load(page-1)}/></View>
              <Text style={{fontSize:12,color:C.inkMuted}}>{page}/{data.totalPages}ページ</Text>
              <View style={{flex:1}}><Button title="次へ" secondary disabled={loading||page>=data.totalPages} onPress={()=>load(page+1)}/></View>
            </View>}
          </Card>
        </>}
        <Button title="予約履歴へ戻る" secondary onPress={()=>router.replace('/(tabs)/reservations')}/>
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
