# Деплой через Git

## Схема

```
Mac: ветка → PR → merge в main → git push
                    ↓
Сервер: bash deploy/git-update.sh  (git pull + docker rebuild)
```

`.env` на сервере **не в Git** — при `git pull` не перезаписывается.

---

## Один раз на сервере

Если проект уже лежит в `/opt/aurent-pos` (rsync), привязать к GitHub:

```bash
cd /opt/aurent-pos
bash deploy/git-bootstrap.sh
```

Или чистый клон (без rsync):

```bash
git clone https://github.com/Timur1019/postsystem.git /opt/aurent-pos
cd /opt/aurent-pos
bash deploy/ubuntu-prepare.sh   # если ещё не делали
bash deploy/setup-env.sh
bash deploy/deploy.sh
```

---

## Каждое обновление

### На Mac (разработка)

```bash
cd /Users/timur/Desktop/postsystem
git checkout -b feature/my-change
# ... правки ...
git add -A
git commit -m "описание изменений"
git push -u origin feature/my-change
```

На GitHub: **Pull Request** → **Merge** в `main`.

Локально обновить main:

```bash
git checkout main
git pull origin main
```

### На сервере

```bash
ssh root@111.88.132.126
cd /opt/aurent-pos
bash deploy/git-update.sh
```

Скрипт сделает: `git pull` → `deploy.sh` (пересборка контейнеров).

---

## Полезные команды

```bash
cd /opt/aurent-pos
git log -1 --oneline          # какая версия на сервере
git status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend --tail 50
```

---

## Приватный репозиторий

На сервере настройте SSH-ключ для GitHub:

```bash
ssh-keygen -t ed25519 -C "server-aurent-pos" -f ~/.ssh/id_ed25519_github -N ""
cat ~/.ssh/id_ed25519_github.pub
# добавить ключ в GitHub → Settings → SSH keys

git clone git@github.com:Timur1019/postsystem.git /opt/aurent-pos
```

---

## Rsync (запасной вариант)

Если Git недоступен:

```bash
./deploy/sync-to-server.sh root@IP
```

На сервере по-прежнему: `bash deploy/deploy.sh`
