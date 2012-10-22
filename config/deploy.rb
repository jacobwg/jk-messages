require 'bundler/capistrano'

set :application, "kathryn"
set :repository,  "git@github.com:jacobwg/chat.git"

set :scm, :git
set :branch, 'master'

server 'quorra.jacobwg.com', :app, :web, :db, :primary => true

set :deploy_to, '/data/apps/kathryn'

set :shared_children, shared_children + %w{config/application.yml}

set :user, 'web'
set :use_sudo, false

ssh_options[:forward_agent] = true
default_run_options[:pty] = true


set :deploy_via, :remote_cache

# if you want to clean up old releases on each deploy uncomment this:
# after "deploy:restart", "deploy:cleanup"

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts

# If you are using Passenger mod_rails uncomment this:
namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
    run 'whenever -w kathryn'
  end
end