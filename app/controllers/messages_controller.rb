class MessagesController < ApplicationController

  def index
    @last_day = Message.last.time_cst.to_date
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @messages = Message.where(['time >= ? and time <= ?', @day.to_time.beginning_of_day, @day.to_time.end_of_day])

    respond_to do |format|
      format.html # index.html.erb
      format.js
      format.json { render json: @messages }
    end
  end

  def search
    if params[:q]
      @query = params[:q]
      @messages = Message.search(params)
      respond_to do |format|
        format.html
      end
    else
      redirect_to :root
    end
  end

end
