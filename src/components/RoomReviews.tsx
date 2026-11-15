import { Text, View } from 'react-native';
import { C } from '../theme';
import type { RoomDetail, RoomReview } from '../types';
import { Card } from './UI';
import { displayDate } from '../lib/bookingLogic.js';
import { starText } from '../lib/reviewLogic.js';

function ReviewCard({review}:{review:RoomReview}) {
  return <View style={{backgroundColor:C.background,borderColor:C.border,borderWidth:1,borderRadius:13,padding:13,gap:8}}>
    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8}}>
      <Text accessibilityLabel={`評価${review.score ?? 'なし'}点`} style={{fontSize:19,color:C.amber,fontWeight:'800'}}>{starText(review.score)}</Text>
      <Text style={{color:C.inkMuted,fontSize:12}}>{displayDate(review.createdAtUtc)}</Text>
    </View>
    <Text style={{color:C.ink,lineHeight:22}}>{review.content}</Text>
    <Text style={{color:C.inkMuted,fontSize:12}}>投稿者：{review.userName||'ユーザー'}</Text>
    {review.hostReply&&<View style={{backgroundColor:C.white,borderRadius:11,padding:12,gap:6,borderWidth:1,borderColor:'#CBE8E3'}}>
      <Text style={{color:C.brand,fontWeight:'800',fontSize:12}}>スタジオ提供者からの返信</Text>
      <Text style={{color:C.ink,lineHeight:21}}>{review.hostReply}</Text>
    </View>}
  </View>;
}
export function RoomReviews({room}:{room:RoomDetail}) {
  const reviews=room.reviews||[];
  const hidden=room.hiddenHostReplies||[];
  return <Card>
    <View style={{gap:5}}>
      <Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>この部屋のレビュー</Text>
      <Text style={{fontSize:20,color:C.amber,fontWeight:'800'}}>{starText(room.averageScore)} <Text style={{fontSize:14,color:C.inkMuted}}>{room.averageScore!=null?`${room.averageScore.toFixed(1)} / 5`:'レビューなし'}（{room.reviewCount||0}件）</Text></Text>
    </View>
    {reviews.length===0?<Text style={{color:C.inkMuted}}>まだレビューはありません。</Text>:reviews.map(review=><ReviewCard key={review.id} review={review}/>)}
    {hidden.length>0&&<View style={{gap:10,borderTopWidth:1,borderTopColor:C.border,paddingTop:14}}>
      <Text style={{fontSize:16,fontWeight:'800',color:C.ink}}>ホストからのお知らせ</Text>
      {hidden.filter(review=>Boolean(review.hostReply)).map(review=><View key={review.id} style={{padding:13,borderRadius:12,backgroundColor:'#EEF7F5',gap:7}}>
        <Text style={{fontSize:12,fontWeight:'700',color:C.brand}}>非公開レビューへのホスト返信</Text>
        <Text style={{color:C.ink,lineHeight:21}}>{review.hostReply}</Text>
      </View>)}
    </View>}
    <Text style={{color:C.inkMuted,fontSize:12,lineHeight:20}}>レビュー投稿は、ログイン後の「予約履歴」で利用済みの予約から行えます。</Text>
  </Card>;
}
