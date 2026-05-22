import type { Asset, Owner } from '../types/domain';

export const MOCK_USER: Owner = {
  name: '박지훈',
  email: 'jihoon.park@lge.com',
  dept: '보안운영실',
};

export const ASSET_TYPE_OPTIONS = ['온프레미스', '클라우드', '하이브리드'];

export const OS_OPTIONS = [
  'Windows 11',
  'Windows 10',
  'Windows Server 2022',
  'Windows Server 2019',
  'macOS Sonoma',
  'macOS Ventura',
  'Ubuntu 22.04',
  'Ubuntu 20.04',
  'RHEL 9',
  'RHEL 8',
  'CentOS 7',
  '기타',
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'ASSET-008291',
    assetType: '온프레미스',
    hostname: 'dev-server-01',
    purpose: '개발 서버',
    ips: ['10.20.30.40'],
    internet: 'no',
    domain: 'lge.com',
    os: 'Ubuntu 22.04',
    osVersion: '22.04.3 LTS',
    location: '서울 마곡 LG사이언스파크 R&D본관 5층 521호',
    antivirus: 'yes',
    edr: 'yes',
    owner: null,
    qualysDetectedAt: '2026-04-12T09:33:00Z',
    updatedAt: null,
    updatedBy: null,
  },
];
