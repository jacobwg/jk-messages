class UsersController < ApplicationController
  def index
    @users = User.select([:uid, :status, :icon])
    respond_to do |format|
      format.json { render json: @users }
    end
  end
end