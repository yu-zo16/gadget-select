"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- 型定義 ---
type GadgetItem = {
  asin: string;
  title: string;
  category_name: string;
  total_score: number;
  last_rank: number;
  price_text: string;
  url: string;
  image_url: string;
  is_sale: boolean;
  updated_at: string;
};

// --- Supabase クライアント初期化 ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABS = [
  { id: "popular", label: "人気商品" },
  { id: "sale", label: "オススメ・割引商品" },
  { id: "マウス", label: "マウス" },
  { id: "キーボード", label: "キーボード" },
  { id: "配線整理", label: "配線整理" },
  { id: "PCスタンド", label: "PCスタンド" },
  { id: "モバイルモニター", label: "モバイルモニター" },
  { id: "USBハブ", label: "USBハブ" },
  { id: "充電器", label: "充電器" },
  { id: "デスク小物", label: "デスク小物" },
  { id: "オーディオ", label: "オーディオ" },
] as const;

export default function GadgetRankingSite() {
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [products, setProducts] = useState<GadgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [activeTab, mounted]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("gadget_rankings").select("*");

      if (activeTab === "popular") {
        // 【修正】人気ランキングからは「セール特化（スコア0）」を除外
        query = query
          .neq("category_name", "セール特化")
          .order("total_score", { ascending: false })
          .limit(30);
      } else if (activeTab === "sale") {
        // 【修正】セール特化カテゴリのみを取得し、Amazonの順位順に並べる
        query = query
          .eq("category_name", "セール特化")
          .order("last_rank", { ascending: true });
      } else {
        query = query
          .eq("category_name", activeTab)
          .order("total_score", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts((data as GadgetItem[]) || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            エンジニア・デスク環境ランキング
          </h1>
          <p className="text-center text-gray-500 text-sm mt-2">Amazon売れ筋 × 長期評価の独自スコアリング</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-2 pb-4 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {tab.label}
              {tab.id === "sale" && " 🔥"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        
        {/* --- セールタブ専用：一番最初に注意文言を追加 --- */}
        {activeTab === "sale" && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded shadow-sm">
            <p className="text-amber-800 text-sm font-bold flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              タイムセール商品のため、閲覧のタイミングによってはセールが終了している可能性があります。
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-400 font-medium">データを取得中...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-inner border border-dashed border-gray-300">
            <p className="text-gray-400">現在、このカテゴリに表示できる商品がありません。</p>
            <p className="text-xs text-gray-300 mt-2">Pythonスクリプトを実行してDBを更新してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((item, index) => (
              <div
                key={item.asin}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="relative p-6 aspect-square bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image_url || "/api/placeholder/400/400"}
                    alt={item.title}
                    className="object-contain max-h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  {activeTab === "popular" && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 text-xs font-black h-8 w-8 flex items-center justify-center rounded-full shadow border-2 border-white">
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-grow flex flex-col border-t border-gray-50">
                  <div className="mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">
                      {item.category_name}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 line-clamp-2 h-10 leading-tight mb-3">
                    {item.title}
                  </h2>
                  
                  {/* --- 価格表示エリアの修正 --- */}
                  <div className="flex items-baseline gap-2 mb-6">
                    {item.category_name === "セール特化" ? (
                      <span className="text-xs font-bold text-gray-500">
                        価格は下記から確認できます
                      </span>
                    ) : (
                      <>
                        <span className="text-xl font-black text-gray-900">{item.price_text}</span>
                        <span className="text-[10px] text-gray-400"></span>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full bg-gray-900 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200 text-xs gap-2"
                    >
                      Amazon 詳細
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="text-center py-10 text-gray-400 text-xs">
        <p>© 2026 Engineer's Gadget Ranking - powered by Supabase & Amazon API</p>
      </footer>
    </div>
  );
}