from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime
from calendar_app.models import ChronoGroup, Event, EventTemplate

class Command(BaseCommand):
    help = 'Seeds initial users, groups, templates, and events for ChronoShare prototype.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database data...')

        # 1. Create Users
        users_data = [
            {'username': 'hiro', 'first_name': 'ヒロ（あなた）', 'email': 'hiro@example.com', 'password': 'password123'},
            {'username': 'alice', 'first_name': '田中 アリス', 'email': 'alice@example.com', 'password': 'password123'},
            {'username': 'bob', 'first_name': 'ボブ・スミス', 'email': 'bob@example.com', 'password': 'password123'},
        ]

        seeded_users = {}
        for u_data in users_data:
            user, created = User.objects.get_or_create(
                username=u_data['username'],
                defaults={
                    'email': u_data['email'],
                    'first_name': u_data['first_name']
                }
            )
            if created:
                user.set_password(u_data['password'])
                user.save()
                self.stdout.write(f'Created user: {user.username}')
            else:
                self.stdout.write(f'User already exists: {user.username}')
            seeded_users[u_data['username']] = user

        # 2. Create Groups
        groups_data = [
            {
                'name': '開発チーム',
                'description': 'ChronoShareのフロントエンドおよびバックエンドの開発スケジュール調整スペース。',
                'invite_code': 'DEV-SYNC-88',
                'created_by': seeded_users['hiro'],
                'members': [seeded_users['hiro'], seeded_users['alice']]
            },
            {
                'name': 'マーケティング委員会',
                'description': 'ローンチキャンペーン、SNS運用、広告出稿のスケジュール調整スペース。',
                'invite_code': 'MKT-GROW-55',
                'created_by': seeded_users['hiro'],
                'members': [seeded_users['hiro'], seeded_users['bob']]
            }
        ]

        seeded_groups = {}
        for g_data in groups_data:
            group, created = ChronoGroup.objects.get_or_create(
                invite_code=g_data['invite_code'],
                defaults={
                    'name': g_data['name'],
                    'description': g_data['description'],
                    'created_by': g_data['created_by']
                }
            )
            
            # Reset members list to match data
            group.members.set(g_data['members'])
            group.save()
            
            if created:
                self.stdout.write(f'Created group: {group.name}')
            else:
                self.stdout.write(f'Group already exists: {group.name}')
            seeded_groups[group.name] = group

        # 3. Create Templates
        templates_data = [
            {
                'name': '週次進捗同期ミーティング',
                'title_template': '週次進捗同期ミーティング 🔄',
                'description_template': '### アジェンダ\n1. 今週のタスク進捗報告\n2. 設計上の課題・技術的負債の共有\n3. 次スプリントの計画\n4. 質疑応答・相談',
                'default_duration_minutes': 60,
                'group': seeded_groups['開発チーム'],
                'created_by': seeded_users['hiro']
            },
            {
                'name': '朝会（スタンドアップ）',
                'title_template': 'デイリースタンドアップ朝会 ☕',
                'description_template': '・昨日やったこと\n・今日やること\n・現在のボトルネック・共有事項',
                'default_duration_minutes': 15,
                'group': seeded_groups['開発チーム'],
                'created_by': seeded_users['alice']
            },
            {
                'name': 'コードレビュー勉強会',
                'title_template': 'コードレビュー＆リファクタリング会 🛠️',
                'description_template': '保留中のプルリクエストをチームでレビューします。各自1つ以上レビュー対象を用意してください。',
                'default_duration_minutes': 45,
                'group': seeded_groups['開発チーム'],
                'created_by': seeded_users['hiro']
            },
            {
                'name': 'SNSキャンペーン企画',
                'title_template': 'SNSキャンペーン＆広告戦略会議 🚀',
                'description_template': '投稿ビジュアルの確認、ターゲット層の分析、配信スケジュールの調整を行います。',
                'default_duration_minutes': 90,
                'group': seeded_groups['マーケティング委員会'],
                'created_by': seeded_users['bob']
            }
        ]

        for t_data in templates_data:
            template, created = EventTemplate.objects.get_or_create(
                name=t_data['name'],
                group=t_data['group'],
                defaults={
                    'title_template': t_data['title_template'],
                    'description_template': t_data['description_template'],
                    'default_duration_minutes': t_data['default_duration_minutes'],
                    'created_by': t_data['created_by']
                }
            )
            if created:
                self.stdout.write(f'Created template: {template.name}')
            else:
                self.stdout.write(f'Template already exists: {template.name}')

        # 4. Create Events
        events_data = [
            {
                'title': 'スプリントプランニング',
                'start_time': '2026-06-15T10:00:00',
                'end_time': '2026-06-15T11:30:00',
                'group': seeded_groups['開発チーム'],
                'description': '製品バックログのレビューと、今スプリントのスプリント目標を設定します。',
                'color': '#22d3ee',
                'created_by': seeded_users['hiro']
            },
            {
                'title': 'アリス集中ワーク時間',
                'start_time': '2026-06-16T14:00:00',
                'end_time': '2026-06-16T16:00:00',
                'group': seeded_groups['開発チーム'],
                'description': '開発の集中時間。緊急時以外の会議は入れないでください。',
                'color': '#38bdf8',
                'created_by': seeded_users['alice']
            },
            {
                'title': 'デイリースタンドアップ朝会 ☕',
                'start_time': '2026-06-16T09:30:00',
                'end_time': '2026-06-16T09:45:00',
                'group': seeded_groups['開発チーム'],
                'description': '・昨日やったこと\n・今日やること\n・現在のボトルネック・共有事項',
                'color': '#06b6d4',
                'created_by': seeded_users['alice']
            },
            {
                'title': 'SNSキャンペーン＆広告戦略会議 🚀',
                'start_time': '2026-06-17T13:00:00',
                'end_time': '2026-06-17T14:30:00',
                'group': seeded_groups['マーケティング委員会'],
                'description': '配信するクリエイティブとコピーのすり合わせを行います。',
                'color': '#38bdf8',
                'created_by': seeded_users['bob']
            },
            {
                'title': '週次進捗同期ミーティング 🔄',
                'start_time': '2026-06-18T11:00:00',
                'end_time': '2026-06-18T12:00:00',
                'group': seeded_groups['開発チーム'],
                'description': '### アジェンダ\n1. 今週のタスク進捗報告\n2. 設計上の課題・技術的負債の共有\n3. 次スプリントの計画\n4. 質疑応答・相談',
                'color': '#22d3ee',
                'created_by': seeded_users['hiro']
            },
            {
                'title': 'ブログ・プレスリリース確認会',
                'start_time': '2026-06-19T15:00:00',
                'end_time': '2026-06-19T16:00:00',
                'group': seeded_groups['マーケティング委員会'],
                'description': 'ローンチに向けたブログ下書きおよびニュースリリースの最終校正を行います。',
                'color': '#06b6d4',
                'created_by': seeded_users['hiro']
            }
        ]

        for e_data in events_data:
            start_tz = make_aware(parse_datetime(e_data['start_time']))
            end_tz = make_aware(parse_datetime(e_data['end_time']))
            
            event, created = Event.objects.get_or_create(
                title=e_data['title'],
                start_time=start_tz,
                group=e_data['group'],
                defaults={
                    'end_time': end_tz,
                    'description': e_data['description'],
                    'color': e_data['color'],
                    'created_by': e_data['created_by']
                }
            )
            if created:
                self.stdout.write(f'Created event: {event.title}')
            else:
                self.stdout.write(f'Event already exists: {event.title}')

        self.stdout.write('Database seeded successfully!')
