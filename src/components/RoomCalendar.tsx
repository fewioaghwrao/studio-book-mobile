import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BusinessHour, CalendarEvent } from '../types';
import { C } from '../theme';
import { Card, Notice } from './UI';
import { calendarSlotRows, dayKey, plusDays } from '../lib/calendarLogic.js';

const colors = {
  open: {bg:'#DDF5E5',text:'#17633D',label:'営業時間'},
  closure: {bg:'#DCE1E5',text:'#42515B',label:'休館'},
  reservation: {bg:'#FCD5D4',text:'#A62F38',label:'予約済み'},
  outside: {bg:'#F4F5F5',text:'#818B89',label:'時間外'},
} as const;
type SlotKind = keyof typeof colors;
function trimDay(date:Date) {return new Date(date.getFullYear(),date.getMonth(),date.getDate());}
function DButton({title,onPress}:{title:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
    style={{paddingHorizontal:12,paddingVertical:9,borderRadius:11,borderWidth:1,borderColor:C.border,backgroundColor:C.white}}>
    <Text style={{color:C.brand,fontWeight:'800',fontSize:13}}>{title}</Text>
  </Pressable>;
}
export function RoomCalendar({businessHours=[],calendarEvents=[]}:{businessHours?:BusinessHour[];calendarEvents?:CalendarEvent[]}) {
  const [selected,setSelected]=useState(()=>trimDay(new Date()));
  const weekStart = useMemo(()=>plusDays(selected,-((selected.getDay()+6)%7)),[selected]);
  const week = useMemo(()=>Array.from({length:7},(_,i)=>plusDays(weekStart,i)),[weekStart]);
  const rows = useMemo(()=>calendarSlotRows(selected,businessHours,calendarEvents),[selected,businessHours,calendarEvents]);
  return <Card>
    <View style={{gap:6}}>
      <Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>空き状況カレンダー</Text>
      <Text style={{fontSize:12,lineHeight:19,color:C.inkMuted}}>Web版のスマホ表示と同じ日単位の予定表です。日付を選んで、営業時間・休館・予約済みを確認できます。</Text>
    </View>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
      {(['open','closure','reservation'] as const).map(k=><View key={k} style={{flexDirection:'row',alignItems:'center',gap:5}}>
        <View style={{height:13,width:13,borderRadius:3,backgroundColor:colors[k].bg,borderWidth:1,borderColor:colors[k].text}}/>
        <Text style={{color:C.inkMuted,fontSize:12}}>{colors[k].label}</Text>
      </View>)}
    </View>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}>
      <DButton title="前日" onPress={()=>setSelected(plusDays(selected,-1))}/>
      <View style={{flex:1,alignItems:'center'}}>
        <Text style={{fontSize:14,fontWeight:'800',color:C.ink}}>{selected.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}</Text>
      </View>
      <DButton title="翌日" onPress={()=>setSelected(plusDays(selected,1))}/>
    </View>
    <View style={{flexDirection:'row',gap:3,justifyContent:'space-between'}}>
      {week.map(day=>{
        const chosen=dayKey(day)===dayKey(selected);
        return <Pressable key={dayKey(day)} accessibilityRole="button" accessibilityLabel={`${day.toLocaleDateString('ja-JP')}を表示`}
          accessibilityState={{selected:chosen}} onPress={()=>setSelected(day)}
          style={{flex:1,alignItems:'center',paddingVertical:10,backgroundColor:chosen?C.brand:C.light,borderRadius:9,gap:3}}>
          <Text style={{fontSize:11,fontWeight:'800',color:chosen?C.white:C.inkMuted}}>{'日月火水木金土'[day.getDay()]}</Text>
          <Text style={{fontSize:14,fontWeight:'800',color:chosen?C.white:C.ink}}>{day.getDate()}</Text>
        </Pressable>;
      })}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="今日を表示" onPress={()=>setSelected(trimDay(new Date()))}
      style={{alignSelf:'flex-end',paddingVertical:4,paddingHorizontal:6}}><Text style={{color:C.brand,fontWeight:'800',fontSize:13}}>今日へ戻る</Text></Pressable>
    <View style={{borderWidth:1,borderColor:C.border,borderRadius:12,overflow:'hidden'}}>
      {rows.map(row=>{
        const current=colors[row.state as SlotKind] ?? colors.outside;
        return <View key={row.key} style={{minHeight:32,flexDirection:'row',borderBottomWidth:1,borderBottomColor:C.border}}>
          <View style={{width:58,justifyContent:'center',paddingLeft:10,backgroundColor:C.white}}>
            <Text style={{color:C.inkMuted,fontSize:12,fontWeight:'700'}}>{row.time}</Text>
          </View>
          <View style={{flex:1,backgroundColor:current.bg,borderLeftWidth:3,borderLeftColor:current.text,paddingLeft:12,justifyContent:'center'}}>
            <Text style={{fontWeight:row.state==='reservation'?'800':'600',color:current.text,fontSize:12}}>{current.label}</Text>
          </View>
        </View>;
      })}
    </View>
    <Notice>このカレンダーは既存APIの予定を表示する参考情報です。「営業時間」でも予約可能とは限りません。予約の可否と料金は予約確認画面でサーバーが最終判定します。</Notice>
  </Card>;
}
