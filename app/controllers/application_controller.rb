class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :load_users

  def load_users
    @jacob = User.where(uid: Settings.jacob_id).first
    @kathryn = User.where(uid: Settings.kathryn_id).first
  end
end
