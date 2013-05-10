class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :load_stuff

  def load_stuff
    @sent_days = Message.all.map { |m| m.time_cst.to_date }.uniq
    @last_day = Message.last.time_cst.to_date
    @jacob = User.where(uid: Settings.jacob_id).first
    @kathryn = User.where(uid: Settings.kathryn_id).first
  end

  private

  def validate
    return if params[:auth] == Settings.auth_key
    if user_signed_in?
      return true if Settings.allowed_users.include? current_user.uid
      redirect_to :unauthorized
    else
      redirect_to :login
    end
  end
end
