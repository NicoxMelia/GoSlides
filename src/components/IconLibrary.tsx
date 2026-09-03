import type { IconType } from 'react-icons';
import * as Lu from 'react-icons/lu';
import * as Pi from 'react-icons/pi';
import * as Tb from 'react-icons/tb';
import * as Hi from 'react-icons/hi2';
import { Sparkles } from 'lucide-react';
import type { IconLibrary } from '../types';

export const ICON_NAMES = [
  'activity','boxes','braces','check','cloud','code','cpu','database','gauge','globe','disk','layers','lock','mail','network','rocket','server','shield','sparkles','terminal','users','wifi','zap',
] as const;
export type IconName = typeof ICON_NAMES[number];

export const ICON_LIBRARIES: Array<{id:IconLibrary;name:string;description:string}> = [
  {id:'lucide',name:'Lucide',description:'Minimalista y técnico'},
  {id:'phosphor',name:'Phosphor',description:'Redondeado y expresivo'},
  {id:'tabler',name:'Tabler',description:'Geométrico y consistente'},
  {id:'heroicons',name:'Heroicons',description:'Limpio y moderno'},
];

const keys: Record<IconLibrary, Record<IconName,string>> = {
  lucide: {activity:'LuActivity',boxes:'LuBoxes',braces:'LuBraces',check:'LuCircleCheck',cloud:'LuCloud',code:'LuCode2',cpu:'LuCpu',database:'LuDatabase',gauge:'LuGauge',globe:'LuGlobe',disk:'LuHardDrive',layers:'LuLayers3',lock:'LuLock',mail:'LuMail',network:'LuNetwork',rocket:'LuRocket',server:'LuServer',shield:'LuShieldCheck',sparkles:'LuSparkles',terminal:'LuSquareTerminal',users:'LuUsers',wifi:'LuWifi',zap:'LuZap'},
  phosphor: {activity:'PiPulse',boxes:'PiCube',braces:'PiBracketsCurly',check:'PiCheckCircle',cloud:'PiCloud',code:'PiCode',cpu:'PiCpu',database:'PiDatabase',gauge:'PiGauge',globe:'PiGlobe',disk:'PiHardDrive',layers:'PiStack',lock:'PiLock',mail:'PiEnvelopeSimple',network:'PiNetwork',rocket:'PiRocket',server:'PiServer',shield:'PiShieldCheck',sparkles:'PiSparkle',terminal:'PiTerminalWindow',users:'PiUsers',wifi:'PiWifiHigh',zap:'PiLightning'},
  tabler: {activity:'TbActivity',boxes:'TbBoxes',braces:'TbBraces',check:'TbCircleCheck',cloud:'TbCloud',code:'TbCode',cpu:'TbCpu',database:'TbDatabase',gauge:'TbGauge',globe:'TbWorld',disk:'TbDeviceHdd',layers:'TbLayersIntersect',lock:'TbLock',mail:'TbMail',network:'TbNetwork',rocket:'TbRocket',server:'TbServer',shield:'TbShieldCheck',sparkles:'TbSparkles',terminal:'TbTerminal2',users:'TbUsers',wifi:'TbWifi',zap:'TbBolt'},
  heroicons: {activity:'HiOutlineSignal',boxes:'HiOutlineCubeTransparent',braces:'HiOutlineCodeBracket',check:'HiOutlineCheckCircle',cloud:'HiOutlineCloud',code:'HiOutlineCodeBracket',cpu:'HiOutlineCpuChip',database:'HiOutlineCircleStack',gauge:'HiOutlineChartBarSquare',globe:'HiOutlineGlobeAlt',disk:'HiOutlineCircleStack',layers:'HiOutlineSquare3Stack3D',lock:'HiOutlineLockClosed',mail:'HiOutlineEnvelope',network:'HiOutlineShare',rocket:'HiOutlineRocketLaunch',server:'HiOutlineServerStack',shield:'HiOutlineShieldCheck',sparkles:'HiOutlineSparkles',terminal:'HiOutlineCommandLine',users:'HiOutlineUsers',wifi:'HiOutlineWifi',zap:'HiOutlineBolt'},
};

const modules: Record<IconLibrary, Record<string,unknown>> = {
  lucide: Lu as unknown as Record<string,unknown>,
  phosphor: Pi as unknown as Record<string,unknown>,
  tabler: Tb as unknown as Record<string,unknown>,
  heroicons: Hi as unknown as Record<string,unknown>,
};

export function IconGlyph({ name, library='lucide', size=32, strokeWidth=1.8 }: { name:string; library?:IconLibrary; size?:number|string; strokeWidth?:number }) {
  const iconName=(ICON_NAMES.includes(name as IconName)?name:'sparkles') as IconName;
  const candidate=modules[library]?.[keys[library][iconName]] as IconType|undefined;
  if (!candidate) return <Sparkles size={size} strokeWidth={strokeWidth}/>;
  const Icon=candidate;
  return <Icon size={size as number} strokeWidth={strokeWidth}/>;
}
