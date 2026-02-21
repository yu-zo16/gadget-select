import time
from amazon_paapi import AmazonApi
from supabase import create_client, Client

# --- 設定項目（変更なし） ---
AMAZON_ACCESS_KEY = 'AKPA46MKWR1768915366'
AMAZON_SECRET_KEY = 'qRA6+RsuAZ6w9H6/8cMSUdicsz+Jp7hb7h4ZsCqT'
PARTNER_TAG = 'yuzo0a-22'
COUNTRY = 'JP'
SUPABASE_URL = "https://xkwstqnpslfeekifamss.supabase.co"
SUPABASE_KEY = "sb_publishable_Gn2l2zhfcqpX8Exm0k2CBw_ekXvkEcX"

amazon = AmazonApi(AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, PARTNER_TAG, COUNTRY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- カテゴリ設定の微調整 ---
CATEGORIES = {
    # 「割引」という言葉を捨て、セールになりやすいブランド名で検索する
    "デスク小物": {"id": "2150058051", "index": "All", "kw": "モニター台"},
    "配線整理": {"id": "2150054051", "index": "All", "kw": "ケーブルホルダー"},
    "PCスタンド": {"id": "2150015051", "index": "All", "kw": "ノートパソコンスタンド"},
    "モバイルモニター": {"id": "2150014051", "index": "All", "kw": "モバイルモニター"},
    "USBハブ": {"id": None, "index": "All", "kw": "USBハブ type-c"}, 
    "充電器": {"id": None, "index": "All", "kw": "充電器"}, 
    "マウス": {"id": None, "index": "All", "kw": "マウス"}, 
    "キーボード": {"id": None, "index": "All", "kw": "キーボード"}, 
    "オーディオ": {"id": "2127209051", "index": "All", "kw": "PCスピーカー"}
}

def update_rankings():
    print(f"🚀 【ヒット率改善モード】更新開始...")

    for cat_name, data in CATEGORIES.items():
        # 取得ページ数
        max_pages = 3 if cat_name == "セール特化" else 1
        print(f"\n📂 カテゴリ: {cat_name}")

        for page in range(1, max_pages + 1):
            try:
                print(f"   📄 {page}ページ目を取得中... (KW: {data['kw']})")
                
                search_args = {
                    "keywords": data['kw'],
                    "search_index": data['index'],
                    "item_count": 10,
                    "item_page": page,
                }
                
                # IDが指定されている場合のみ追加
                if data['id']:
                    search_args["browse_node_id"] = data['id']

                search_result = amazon.search_items(**search_args)
                
                # 取得結果のチェックをより慎重に
                if not search_result or not hasattr(search_result, 'items') or not search_result.items:
                    print(f"   [!] 商品が見つかりませんでした。スキップします。")
                    break

                for i, item in enumerate(search_result.items):
                    asin = item.asin
                    title = item.item_info.title.display_value if item.item_info else "なし"
                    
                    # セール判定（savingsがあるか）
                    is_sale = False
                    if item.offers and item.offers.listings:
                        listing = item.offers.listings[0]
                        if listing.price and listing.price.savings:
                            is_sale = True

                    # セール特化枠なら強制的にTrue（サイトのSALEタブに表示させるため）
                    if cat_name == "セール特化":
                        is_sale = True

                    price_text = "Amazonで価格を確認"
                    if item.offers and item.offers.listings:
                        price_text = item.offers.listings[0].price.display_amount

                    rank = ((page - 1) * 10) + (i + 1)
                    
                    # スコア加算
                    existing = supabase.table("gadget_rankings").select("total_score").eq("asin", asin).execute()
                    prev_score = existing.data[0]['total_score'] if existing.data else 0
                    earned_points = (max(0, 11 - rank) if rank <= 10 else 1)
                    new_total_score = prev_score + earned_points

                    record = {
                        "asin": asin,
                        "title": title,
                        "category_name": cat_name,
                        "total_score": new_total_score,
                        "last_rank": rank,
                        "price_text": price_text,
                        "url": item.detail_page_url,
                        "image_url": item.images.primary.large.url if item.images and item.images.primary else "",
                        "is_sale": is_sale,
                        "updated_at": "now()"
                    }

                    supabase.table("gadget_rankings").upsert(record).execute()
                    print(f"      [{rank:02d}位] {asin} - {status_icon(is_sale)}")

                time.sleep(2) # 連続リクエスト回避

            except Exception as e:
                print(f"   ⚠️ ページ取得失敗: {e}")
                break

    print("\n✨ すべての更新が完了しました！")

def status_icon(is_sale):
    return "🔥SALE" if is_sale else "通常"

if __name__ == "__main__":
    update_rankings()