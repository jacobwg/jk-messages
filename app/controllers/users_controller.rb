class UsersController < ApplicationController
  layout 'plain'

  def index
    @users = User.select([:uid, :status, :icon])
    respond_to do |format|
      format.json { render json: @users }
    end
  end

  def login
    redirect_to :root if user_signed_in?
  end

  def unauthorized
    redirect_to :root if not user_signed_in? or Settings.allowed_users.include? current_user.uid
  end
end