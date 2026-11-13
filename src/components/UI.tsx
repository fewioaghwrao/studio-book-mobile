import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { C } from '../theme';
export function Button({title,onPress,disabled=false,loading=false,secondary=false,danger=false}:{title:string;onPress:()=>void;disabled?:boolean;loading?:boolean;secondary?:boolean;danger?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled||loading} onPress={onPress}
  style={({pressed})=>[styles.button,secondary?styles.secondary:danger?styles.danger:styles.primary,(disabled||loading)&&{opacity:.5},pressed&&{opacity:.75}]}>
  {loading?<ActivityIndicator color={secondary?C.brand:C.white}/>:<Text style={[styles.buttonText,secondary&&{color:C.brand}]}>{title}</Text>}
 </Pressable>;
}
export function Field({label,value,onChangeText,placeholder,secureTextEntry,keyboardType,autoCapitalize,multiline}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder?:string;secureTextEntry?:boolean;keyboardType?:KeyboardTypeOptions;autoCapitalize?:'none'|'sentences'|'words'|'characters';multiline?:boolean}) {
 return <View style={{gap:7}}><Text style={styles.fieldLabel}>{label}</Text><TextInput
  accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
  placeholderTextColor="#A1ADA6" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize??'none'}
  multiline={multiline} style={[styles.field,multiline&&{height:90,textAlignVertical:'top'}]} />
 </View>;
}
export function Card({children,style}:{children:ReactNode;style?:object}) {return <View style={[styles.card,style]}>{children}</View>;}
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}) {return <View style={[styles.notice,error&&{backgroundColor:C.dangerPale}]}><Text style={{color:error?C.danger:C.inkMuted,lineHeight:21,fontSize:13}}>{children}</Text></View>;}
export function Loading({label='読み込み中...'}:{label?:string}) {return <View style={{padding:32,alignItems:'center',gap:12}}><ActivityIndicator size="large" color={C.brand}/><Text style={{color:C.inkMuted}}>{label}</Text></View>;}
export function Title({eyebrow,title,subtitle}:{eyebrow?:string;title:string;subtitle?:string}) {return <View style={{gap:6,marginBottom:17}}>{eyebrow&&<Text style={{fontSize:12,color:C.brand,fontWeight:'800',letterSpacing:1}}>{eyebrow}</Text>}<Text style={{fontSize:27,color:C.ink,fontWeight:'800'}}>{title}</Text>{subtitle&&<Text style={{color:C.inkMuted,lineHeight:21}}>{subtitle}</Text>}</View>;}
export function RowInfo({label,value}:{label:string;value:string}) {return <View style={{paddingVertical:11,borderBottomWidth:1,borderColor:C.border,flexDirection:'row',justifyContent:'space-between',gap:12}}><Text style={{color:C.inkMuted,flex:1}}>{label}</Text><Text style={{color:C.ink,fontWeight:'600',flex:2,textAlign:'right'}}>{value}</Text></View>;}
const styles=StyleSheet.create({
 button:{minHeight:50,borderRadius:14,justifyContent:'center',alignItems:'center',paddingHorizontal:19},
 primary:{backgroundColor:C.brand},secondary:{backgroundColor:C.mint,borderColor:'#BBD9D2',borderWidth:1},danger:{backgroundColor:C.danger},
 buttonText:{color:C.white,fontWeight:'800',fontSize:15},
 fieldLabel:{color:C.ink,fontSize:13,fontWeight:'700'},field:{borderWidth:1,borderColor:C.border,backgroundColor:C.white,borderRadius:13,paddingHorizontal:15,paddingVertical:12,fontSize:16,color:C.ink,minHeight:50},
 card:{backgroundColor:C.white,borderRadius:20,borderWidth:1,borderColor:C.border,padding:18,gap:12},
 notice:{backgroundColor:C.mint,padding:13,borderRadius:12}
});
