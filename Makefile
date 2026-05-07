.PHONY: dev setup start stop reset

# 一键启动：Supabase + Vite dev server
dev: start
	npm run dev

# 首次设置：初始化 Supabase + 生成 .env.local
setup:
	@command -v supabase >/dev/null 2>&1 || { echo "请先安装: brew install supabase/tap/supabase"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "请先安装并启动 Docker Desktop"; exit 1; }
	@supabase init 2>/dev/null || true
	supabase start
	@echo ""
	@echo "=== 写入 .env.local ==="
	@ANON_KEY=$$(supabase status --output json 2>/dev/null | grep -o '"anon_key":"[^"]*"' | cut -d'"' -f4); \
	if [ -z "$$ANON_KEY" ]; then \
		echo "⚠️  无法自动获取 anon key，请手动从 supabase status 复制到 .env.local"; \
	else \
		echo "VITE_SUPABASE_URL=http://127.0.0.1:54321" > .env.local; \
		echo "VITE_SUPABASE_ANON_KEY=$$ANON_KEY" >> .env.local; \
		echo "VITE_APP_URL=http://localhost:5173" >> .env.local; \
		echo "✅ .env.local 已生成"; \
	fi
	@echo ""
	@echo "=== 设置完成 ==="
	@echo "运行 make dev 启动开发环境"

# 启动本地 Supabase（如果没在运行）
start:
	@supabase status >/dev/null 2>&1 || supabase start

# 停止本地 Supabase
stop:
	supabase stop

# 重置数据库（清空所有数据，重跑 migrations）
reset:
	supabase db reset
