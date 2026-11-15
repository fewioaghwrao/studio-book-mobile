import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Card, Notice, RowInfo, Title } from '../../src/components/UI';
import { StudioImage } from '../../src/components/StudioImage';
import { aiRoomSearch, ApiError } from '../../src/lib/api';
import { formatAiCapacity, formatAiSlotLabel, getAiReservationParams } from '../../src/lib/aiSearchLogic.js';
import { yen } from '../../src/lib/bookingLogic.js';
import { C } from '../../src/theme';
import type { AiRoomSearchItem, AiRoomSearchResponse, AiRequestedSlot } from '../../src/types';

const examples = [
  '落ち着いた雰囲気で、夜に使える撮影向けのスタジオを探したい',
  '10人くらいで使える、駅近っぽい配信向けスタジオ',
  '10人以下の小さめなスタジオを探したい',
  'ヨガや少人数レッスンに向いている明るい部屋',
  '新宿区周辺で、10000円以内の撮影向けスタジオ',
];

function conditionValue(value: string | number | null | undefined) {
  return value == null || value === '' ? '指定なし' : String(value);
}

function AiResultCard({room, slot}:{room:AiRoomSearchItem;slot:AiRequestedSlot | null}) {
  const router = useRouter();
  const params = getAiReservationParams(room.id, slot, room.availability);
  const reasons = room.reasons?.filter(Boolean) ?? [];
  const availability = room.availability;
  return <Card style={{padding:0,overflow:'hidden'}}>
    <StudioImage imageName={room.imageName} style={{width:'100%',height:177}} />
    <View style={{padding:16,gap:12}}>
      <View style={{gap:6}}>
        <Text style={{fontSize:11,fontWeight:'800',color:C.brand}}>✦ AIおすすめ</Text>
        <Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>{room.name}</Text>
        <Text style={{color:C.inkMuted,fontSize:12}}>⌖  {room.address}</Text>
      </View>
      <View style={styles.reasonBox}>
        <Text style={{fontSize:12,fontWeight:'800',color:C.brand}}>おすすめ理由</Text>
        {reasons.length > 0 ? reasons.map((reason,i)=><Text key={`${room.id}-${i}`} style={styles.reasonText}>・{reason}</Text>) :
         <Text style={styles.reasonText}>{room.reason || '入力された希望条件に関連するスタジオとして候補に入りました。'}</Text>}
      </View>
      <Text style={{color:C.inkMuted,fontSize:13,lineHeight:20}} numberOfLines={3}>{room.description || '説明はありません。'}</Text>
      <View style={{flexDirection:'row',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <Text style={{color:C.brand,fontSize:19,fontWeight:'800'}}>{yen(room.price)}<Text style={{fontSize:12,fontWeight:'500'}}> / 時間</Text></Text>
        <Text style={{color:C.inkMuted,fontSize:12}}>定員 {room.capacity}名　★{room.averageScore?.toFixed(1) ?? '未評価'}</Text>
      </View>
      {slot && availability ? <View style={{gap:5,paddingVertical:10,borderTopWidth:1,borderColor:C.border}}>
        <Text style={{fontSize:12,color:C.inkMuted}}>{formatAiSlotLabel(slot)}</Text>
        <Text style={{fontSize:13,fontWeight:'700',color:availability.isAvailable ? C.brand : C.inkMuted}}>
          空き状況：{availability.label || (availability.isAvailable ? '予約可能' : '予約できません')}
        </Text>
      </View> : null}
      <Button title="スタジオ詳細を見る" secondary onPress={()=>router.push({pathname:'/rooms/[id]',params:{id:String(room.id)}})} />
      {params && <Button title="この日時で予約確認へ" onPress={()=>router.push({pathname:'/rooms/[id]/confirm',params})} />}
    </View>
  </Card>;
}

export default function AiSearchScreen() {
  const router=useRouter();
  const [query,setQuery]=useState(examples[0]);
  const [result,setResult]=useState<AiRoomSearchResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  const search=async()=>{
    const q=query.trim();
    if (!q) {setError('検索したい内容を入力してください。');return;}
    if (q.length>200) {setError('検索文は200文字以内で入力してください。');return;}
    setLoading(true);setError('');setResult(null);
    try {
      const data=await aiRoomSearch(q);
      setResult(data);
    } catch(e) {
      setError(e instanceof ApiError && e.status===429
        ? 'AI検索の利用回数が一時的に上限に達しました。少し時間をおいてから再度お試しください。'
        : e instanceof Error ? e.message : 'AI検索に失敗しました。通信状態をご確認ください。');
    } finally {setLoading(false);}
  };

  const conditions=result?.interpretedConditions;
  return <ScrollView style={{backgroundColor:C.background}} keyboardShouldPersistTaps="handled"
    contentContainerStyle={{padding:18,gap:17,paddingBottom:40}}>
    <Stack.Screen options={{title:'AIスタジオ検索'}} />
    <Title eyebrow="AI STUDIO SEARCH" title="AIでスタジオを探す"
      subtitle="用途・雰囲気・人数・エリアなど、希望を文章で入力するとAIが条件に合いそうなスタジオを提案します。" />
    <Notice>この機能はポートフォリオ用のデモです。AIの条件解釈・おすすめ理由には不正確な内容が含まれる場合があります。実際の条件はスタジオ詳細で確認してください。連続利用には回数制限があります。</Notice>
    <Card>
      <Text style={styles.sectionTitle}>探したいスタジオの希望条件</Text>
      <TextInput
        accessibilityLabel="AI検索の希望条件" value={query}
        onChangeText={v=>{setQuery(v);if(error)setError('');}} placeholder="例：落ち着いた雰囲気で夜に使える撮影スタジオ"
        placeholderTextColor="#9DAAA5" maxLength={200} multiline
        style={styles.textarea} textAlignVertical="top" />
      <Text style={{color:C.inkMuted,fontSize:12,textAlign:'right'}}>{query.length} / 200文字</Text>
      <Button title={loading?'AI検索中…':'✦ AIで探す'} onPress={search} disabled={loading} loading={loading} />
      <Button title="通常のスタジオ検索へ戻る" secondary onPress={()=>router.back()} />
      <Text style={[styles.sectionTitle,{marginTop:8}]}>入力例（タップして入力）</Text>
      <View style={{gap:8}}>{examples.map(example=><Pressable accessibilityRole="button" key={example}
        onPress={()=>{setQuery(example);setError('');}} style={styles.example}>
        <Text style={{color:C.brand,lineHeight:19,fontSize:13}}>{example}</Text>
      </Pressable>)}</View>
    </Card>
    {error ? <Notice error>{error}</Notice> : null}
    {loading ? <View style={{padding:26,alignItems:'center',gap:12}}><ActivityIndicator size="large" color={C.brand}/><Text style={{color:C.inkMuted}}>AIが検索条件を解析しています...</Text></View> : null}
    {!loading && result ? <>
      {conditions ? <Card>
        <Text style={styles.sectionTitle}>AIが解釈した条件</Text>
        <RowInfo label="用途" value={conditionValue(conditions.purpose)}/>
        <RowInfo label="雰囲気" value={conditionValue(conditions.atmosphere)}/>
        <RowInfo label="エリア" value={conditionValue(conditions.area)}/>
        <RowInfo label="予算" value={conditions.price ? `${yen(conditions.price)}以内` : '指定なし'}/>
        <RowInfo label="人数" value={formatAiCapacity(conditions.capacity,conditions.capacityCondition)}/>
        <RowInfo label="利用日時" value={result.requestedSlot ? formatAiSlotLabel(result.requestedSlot) : '指定なし'}/>
        <RowInfo label="時間帯" value={conditionValue(conditions.timePreference)}/>
        {conditions.keywords?.length ? <View style={{gap:8,paddingTop:8}}><Text style={{fontSize:12,fontWeight:'800',color:C.ink}}>キーワード</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
          {conditions.keywords.map((word,i)=><Text key={`${word}-${i}`} style={styles.chip}>{word}</Text>)}
        </View></View> : null}
      </Card> : null}
      {result.relaxed ? <Notice>条件を一部緩めて検索した結果です。</Notice> : null}
      {(result.notices??[]).map((message,i)=><Notice key={`notice-${i}`}>{message}</Notice>)}
      <View style={{gap:6}}>
        <Text style={{fontSize:20,fontWeight:'800',color:C.ink}}>AIおすすめ結果：{result.rooms?.length??0}件</Text>
        <Text style={{color:C.inkMuted,fontSize:12,lineHeight:19}}>
          {result.requestedSlot ? '指定日時に空きのあるスタジオから順に最大5件表示します。空き状況は予約確認時に再判定されます。' : '条件に近いスタジオを最大5件表示します。'}
        </Text>
      </View>
      {result.rooms?.length ? result.rooms.map(room=><AiResultCard key={room.id} room={room} slot={result.requestedSlot??null}/>) :
        <Notice>条件に近いスタジオは見つかりませんでした。条件を少し広げて再検索してください。</Notice>}
    </> : null}
  </ScrollView>;
}

const styles=StyleSheet.create({
  sectionTitle:{color:C.ink,fontSize:16,fontWeight:'800'},
  textarea:{height:112,borderRadius:13,borderWidth:1,borderColor:C.border,backgroundColor:C.white,color:C.ink,padding:14,fontSize:15,lineHeight:22},
  example:{backgroundColor:C.mint,borderRadius:11,borderWidth:1,borderColor:'#CDE3DD',padding:11},
  chip:{backgroundColor:C.mint,color:C.brand,fontSize:12,overflow:'hidden',paddingVertical:7,paddingHorizontal:11,borderRadius:20},
  reasonBox:{backgroundColor:C.mint,borderRadius:14,padding:13,gap:7},
  reasonText:{color:C.ink,fontSize:13,lineHeight:20},
});
