'use client';

import { useState, useEffect } from 'react';
import { pveApi, ensurePVEAuth } from '@/lib/pve-api';

export default function PVEDataDemoPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      // 确保已登录 PVE
      await ensurePVEAuth();

      // 并行获取所有数据
      const [walletsRes, hierarchyRes, commissionsRes, levelsRes] = await Promise.all([
        pveApi.getWallets(1, 50),
        pveApi.getHierarchy(),
        pveApi.getCommissionRecords(),
        pveApi.getMemberLevelConfig(),
      ]);

      // 处理钱包数据（可能有分页）
      const walletsData = walletsRes.data.wallets || walletsRes.data || [];
      setWallets(walletsData);

      // 处理其他数据
      setHierarchy(hierarchyRes.data || []);
      setCommissions(commissionsRes.data || []);
      setLevels(levelsRes.data || []);

    } catch (err: any) {
      setError(err.message || '加载数据失败');
      console.error('Error loading PVE data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在从 PVE 加载数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            PVE 数据中心演示
          </h1>
          <p className="mt-2 text-gray-600">
            从 PVE 运营中心获取的实时数据
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">钱包总数</div>
            <div className="text-3xl font-bold text-blue-600">{wallets.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">层级关系</div>
            <div className="text-3xl font-bold text-green-600">{hierarchy.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">佣金记录</div>
            <div className="text-3xl font-bold text-purple-600">{commissions.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">会员等级</div>
            <div className="text-3xl font-bold text-orange-600">{levels.length}</div>
          </div>
        </div>

        {/* Wallets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              钱包列表（来自 PVE）
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    钱包地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    余额 (ASHVA)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    会员等级
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wallets.slice(0, 10).map((wallet: any) => (
                  <tr key={wallet.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {wallet.wallet_address?.slice(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(wallet.ashva_balance || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${wallet.member_level === 'global_partner' ? 'bg-purple-100 text-purple-800' :
                          wallet.member_level === 'market_partner' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {wallet.member_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wallets.length > 10 && (
            <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600">
              显示前 10 个，共 {wallets.length} 个钱包
            </div>
          )}
        </div>

        {/* Commission Records */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              佣金记录（来自 PVE）
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    钱包地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    等级
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.slice(0, 10).map((commission: any) => (
                  <tr key={commission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {commission.wallet_address?.slice(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {parseFloat(commission.amount || 0).toLocaleString()} ASHVA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Level {commission.commission_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Levels */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              会员等级配置（来自 PVE）
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {levels.map((level: any) => (
                <div key={level.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {level.display_name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>佣金比例: <span className="font-semibold">{level.commission_total_percentage}%</span></div>
                    <div>最大深度: <span className="font-semibold">{level.max_depth}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-2">🎯 数据来源</h3>
          <p className="text-blue-700 text-sm">
            本页面的所有数据都来自 <span className="font-mono font-semibold">PVE 运营中心</span> 的 API。
            Web3 会员中心不再直接访问数据库，而是通过调用 PVE 的统一 API 获取数据。
          </p>
          <p className="text-blue-700 text-sm mt-2">
            API Base URL: <span className="font-mono">https://v0-pve-operations-center.vercel.app</span>
          </p>
        </div>
      </div>
    </div>
  );
}
