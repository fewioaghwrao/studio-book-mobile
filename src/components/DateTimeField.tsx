import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { C } from '../theme';
export function DateTimeField({label,value,onChange,mode}:{label:string;value:Date;onChange:(d:Date)=>void;mode:'date'|'time'}) {
 const [open,setOpen]=useState(false);
 const shown = mode==='date' ? value.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}) : value.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',hour12:false});
 return <View style={{flex:1,gap:7}}><Text style={{fontSize:13,fontWeight:'700',color:C.ink}}>{label}</Text>
  <Pressable onPress={()=>setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}を選択`} style={{borderColor:C.border,borderWidth:1,borderRadius:12,padding:13,minHeight:51,justifyContent:'center',backgroundColor:C.white}}><Text style={{fontWeight:'600',color:C.ink}}>{shown}</Text></Pressable>
  {open&&<View style={{backgroundColor:C.white,borderRadius:12}}>
   <DateTimePicker value={value} mode={mode} display={Platform.OS==='ios'?'spinner':'default'}
    minimumDate={mode==='date'?new Date():undefined}
    onChange={(event,selected)=>{
      if(Platform.OS!=='ios')setOpen(false);
      if(event.type==='dismissed'||!selected)return;
      const d=new Date(value);
      if(mode==='date')d.setFullYear(selected.getFullYear(),selected.getMonth(),selected.getDate());
      else d.setHours(selected.getHours(),selected.getMinutes(),0,0);
      onChange(d);
    }}/>
   {Platform.OS==='ios'&&<Pressable onPress={()=>setOpen(false)} style={{padding:10,alignItems:'flex-end'}}><Text style={{color:C.brand,fontWeight:'800'}}>完了</Text></Pressable>}
  </View>}
 </View>;
}
