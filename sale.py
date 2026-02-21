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

SALE_NODE_ID = "2127210051" 

def update_gold_box_items():
    print(f"🚀 【セール会場取得モード】更新開始...")

    for page in range(1, 4):
        try:
            print(f"   📄 {page}ページ目をスキャン中...")
            
            search_result = amazon.search_items(
                keywords="PC周辺機器", 
                search_index="Computers",
                browse_node_id=SALE_NODE_ID,
                item_count=10,
                item_page=page
            )

            if not search_result or not search_result.items:
                break

            for i, item in enumerate(search_result.items):
                asin = item.asin
                title = item.item_info.title.display_value if item.item_info else "なし"
                
                # 価格情報の取得と文言の書き換え
                raw_price = None
                if item.offers and item.offers.listings:
                    raw_price = item.offers.listings[0].price.display_amount
                
                # 指定の文言に変更（価格が取れていてもいなくてもこの文言にする）
                price_text = "価格は下記から確認できます"

                rank = ((page - 1) * 10) + (i + 1)

                record = {
                    "asin": asin,
                    "title": title,
                    "category_name": "セール特化",
                    "total_score": 0,  # ランキング用ポイントは不要なので0に設定
                    "last_rank": rank,
                    "price_text": price_text, # 指定の文言
                    "url": item.detail_page_url,
                    "image_url": item.images.primary.large.url if item.images and item.images.primary else "",
                    "is_sale": True,
                    "updated_at": "now()"
                }

                supabase.table("gadget_rankings").upsert(record).execute()
                print(f"      [{rank:02d}位] ✅保存: {asin}")

            time.sleep(2)

        except Exception as e:
            print(f"   ⚠️ スキップ: {e}")
            break

    print("\n✨ セール商品の更新が完了しました（スコア0 / 文言変更済）")

if __name__ == "__main__":
    update_gold_box_items()