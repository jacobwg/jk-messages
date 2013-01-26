class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :load_users

  before_filter :authenticate

  def load_users
    @jacob = User.where(uid: Settings.jacob_id).first
    @kathryn = User.where(uid: Settings.kathryn_id).first
  end

  private

  def authenticate
    return if params[:auth] == Settings.auth_key
    authenticate_or_request_with_http_digest(Settings.auth_realm) do |username|
      Settings.auth_users[username]
    end
  end
end
