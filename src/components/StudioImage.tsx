import { useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { WEB_BASE } from '../lib/api';
const localImages:Record<string,number> = {
  "room01.jpg": require("../../assets/rooms/room01.jpg"),
  "room02.jpg": require("../../assets/rooms/room02.jpg"),
  "room03.jpg": require("../../assets/rooms/room03.jpg"),
  "room04.jpg": require("../../assets/rooms/room04.jpg"),
  "room05.jpg": require("../../assets/rooms/room05.jpg"),
  "room06.jpg": require("../../assets/rooms/room06.jpg"),
  "room07.jpg": require("../../assets/rooms/room07.jpg"),
  "room08.jpg": require("../../assets/rooms/room08.jpg"),
  "room09.jpg": require("../../assets/rooms/room09.jpg"),
  "room10.jpg": require("../../assets/rooms/room10.jpg"),
  "room11.jpg": require("../../assets/rooms/room11.jpg"),
  "room12.jpg": require("../../assets/rooms/room12.jpg"),
  "room13.jpg": require("../../assets/rooms/room13.jpg"),
  "room14.jpg": require("../../assets/rooms/room14.jpg"),
  "room15.jpg": require("../../assets/rooms/room15.jpg"),
  "room16.jpg": require("../../assets/rooms/room16.jpg"),
  "room17.jpg": require("../../assets/rooms/room17.jpg"),
  "room18.jpg": require("../../assets/rooms/room18.jpg"),
  "room19.jpg": require("../../assets/rooms/room19.jpg"),
  "room20.jpg": require("../../assets/rooms/room20.jpg"),
  "room21.jpg": require("../../assets/rooms/room21.jpg"),
  "room22.jpg": require("../../assets/rooms/room22.jpg"),
  "room23.jpg": require("../../assets/rooms/room23.jpg"),
  "room24.jpg": require("../../assets/rooms/room24.jpg"),
};
const defaultImage = require('../../assets/main1.jpg');
export function StudioImage({imageName,style}:{imageName:string|null|undefined;style?:StyleProp<ImageStyle>}) {
 const [failed,setFailed]=useState(false);
 const local = imageName && Object.prototype.hasOwnProperty.call(localImages,imageName) ? localImages[imageName] : null;
 // 添付画像と同名なら確実に表示できるローカル画像を優先
 const remote = WEB_BASE && imageName && /^[a-zA-Z0-9_.-]+$/.test(imageName) ? {uri:`${WEB_BASE}/storage/${encodeURIComponent(imageName)}`} : null;
 const source = local || (!failed&&remote) || defaultImage;
 return <Image source={source} style={style} resizeMode="cover" onError={()=>setFailed(true)} accessibilityLabel="スタジオ写真" />;
}
