import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Loading, Notice, Title } from '../../src/components/UI';
import { StudioImage } from '../../src/components/StudioImage';
import { request } from '../../src/lib/api';
import { yen } from '../../src/lib/bookingLogic.js';
import { C } from '../../src/theme';
import type { RoomListItem, RoomListResponse } from '../../src/types';
const sorts=[{key:'createdAtDesc',label:'新着順'},{key:'priceAsc',label:'価格が安い順'},{key:'priceDesc',label:'価格が高い順'}];
export default function StudioSearch() {
 const router=useRouter();
 const [keyword,setKeyword]=useState(''); const [area,setArea]=useState('');
 const [maxPrice,setMaxPrice]=useState(''); const [sort,setSort]=useState('createdAtDesc');
 const [filters,setFilters]=useState({keyword:'',area:'',maxPrice:'',sort:'createdAtDesc'});
 const [items,setItems]=useState<RoomListItem[]>([]);
 const [page,setPage]=useState(1); const [pages,setPages]=useState(1);
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const load=useCallback(async(target=1)=>{
   setLoading(true);setError('');
   try {
    const query=new URLSearchParams({page:String(target),pageSize:'10',order:filters.sort});
    if(filters.keyword)query.set('keyword',filters.keyword);
    if(filters.area)query.set('area',filters.area);
    if(filters.maxPrice)query.set('price',filters.maxPrice);
    const result=await request<RoomListResponse>(`/api/rooms?${query}`);
    setItems(result.items??[]);setPage(result.page??target);setPages(Math.max(1,result.totalPages??1));
   } catch(e){setError(e instanceof Error?e.message:'スタジオを取得できませんでした。');}
   finally{setLoading(false);}
 },[filters]);
 useEffect(()=>{load(1);},[load]);
 return <FlatList data={items} keyExtractor={item=>String(item.id)} style={{backgroundColor:C.background}}
  refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>load(page)} tintColor={C.brand}/>} 
  ListHeaderComponent={<View style={{paddingHorizontal:18,paddingTop:19}}>
   <View style={styles.hero}><Text style={{fontSize:11,letterSpacing:2,color:'#B9E4D8',fontWeight:'800'}}>STUDIO BOOK</Text><Text style={{color:C.white,fontSize:26,fontWeight:'800',lineHeight:35}}>{"ぴったりの空間を、\nスマホで予約。"}</Text><Text style={{color:'#D3EBE4',lineHeight:20,fontSize:13}}>練習・撮影・イベントなど、目的に合うスタジオを検索</Text></View>
   <View style={{marginTop:14}}>
    <Button title="✦ AIでスタジオを探す" secondary onPress={()=>router.push('/rooms/ai-search')}/>
    <Text style={{color:C.inkMuted,fontSize:12,marginTop:7}}>雰囲気・用途・人数などを文章で検索できます。</Text>
   </View>
   <View style={{gap:13,marginTop:19,marginBottom:15}}>
    <Field label="キーワード" value={keyword} onChangeText={setKeyword} placeholder="例：ダンス、池袋、ピアノ"/>
    <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Field label="エリア" value={area} onChangeText={setArea} placeholder="例：豊島区" /></View><View style={{flex:1}}><Field label="上限料金（円/時）" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder="例：5000" /></View></View>
    <Text style={{color:C.ink,fontWeight:'700',fontSize:13}}>並び順</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:-5}} contentContainerStyle={{gap:8}}>{sorts.map(s=><Pressable key={s.key} onPress={()=>setSort(s.key)} style={[styles.chip,sort===s.key&&styles.chipActive]}><Text style={{fontSize:12,fontWeight:'700',color:sort===s.key?C.white:C.inkMuted}}>{s.label}</Text></Pressable>)}</ScrollView>
    <Button title="条件でスタジオを検索" onPress={()=>{setFilters({keyword:keyword.trim(),area:area.trim(),maxPrice:/^\d+$/.test(maxPrice)?maxPrice:'',sort});}}/>
   </View>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:14}}><Text style={{fontSize:19,fontWeight:'800',color:C.ink}}>スタジオ一覧</Text><Text style={{fontSize:12,color:C.inkMuted}}>ページ {page} / {pages}</Text></View>
   {error?<Notice error>{error}</Notice>:null}
   {loading&&items.length===0?<Loading/>:null}
  </View>}
  renderItem={({item})=><Pressable onPress={()=>router.push({pathname:'/rooms/[id]',params:{id:String(item.id)}})} style={styles.roomCard}>
    <StudioImage imageName={item.imageName} style={{height:174,width:'100%'}}/>
    <View style={{padding:15,gap:7}}><Text numberOfLines={1} style={{fontSize:18,fontWeight:'800',color:C.ink}}>{item.name}</Text><Text numberOfLines={1} style={{color:C.inkMuted,fontSize:12}}>⌖  {item.address}</Text><Text style={{color:C.amber,fontSize:12}}>★ {item.averageScore?.toFixed(1)??'未評価'}  <Text style={{color:C.inkMuted}}>({item.reviewCount}件)</Text></Text><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontWeight:'800',fontSize:20,color:C.brand}}>{yen(item.price)}<Text style={{fontSize:12,fontWeight:'500'}}> / 時間</Text></Text><Text style={{color:C.brand,fontWeight:'800'}}>詳細を見る ›</Text></View></View>
  </Pressable>}
  ListEmptyComponent={!loading&&!error?<View style={{padding:30,alignItems:'center'}}><Text style={{color:C.inkMuted}}>条件に一致するスタジオがありません。</Text></View>:undefined}
  ListFooterComponent={<View style={{padding:20,gap:12,flexDirection:'row',justifyContent:'center'}}>{page>1&&<View style={{flex:1}}><Button title="前へ" secondary onPress={()=>load(page-1)} disabled={loading}/></View>}{page<pages&&<View style={{flex:1}}><Button title="次へ" secondary onPress={()=>load(page+1)} disabled={loading}/></View>}</View>}
  contentContainerStyle={{paddingBottom:25}} />;
}
const styles=StyleSheet.create({
 hero:{backgroundColor:C.brandDark,borderRadius:24,padding:24,gap:13},
 chip:{borderRadius:30,borderColor:C.border,borderWidth:1,paddingVertical:10,paddingHorizontal:14,backgroundColor:C.white},
 chipActive:{backgroundColor:C.brand,borderColor:C.brand},
 roomCard:{backgroundColor:C.white,marginHorizontal:18,marginBottom:15,borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:C.border},
});
