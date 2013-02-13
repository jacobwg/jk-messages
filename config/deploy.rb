require 'bundler/capistrano'
require 'whenever/capistrano'

set :whenever_command, 'bundle exec whenever'

set :application, "kathryn"
set :repository,  "git@github.com:jacobwg/jk-messages.git"

set :scm, :git
set :branch, 'master'

server 'quorra.jacobwg.com', :app, :web, :db, :primary => true

set :deploy_to, '/data/apps/kathryn'

set :shared_children, shared_children + %w{config/application.yml config/database.yml}

set :user, 'web'
set :use_sudo, false

ssh_options[:forward_agent] = true
default_run_options[:pty] = true

set :deploy_via, :remote_cache

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end