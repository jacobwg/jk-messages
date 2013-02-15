class MessagesController < ApplicationController

  respond_to :html, :json

  def index
    @last_day = Message.last.time_cst.to_date
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @first_day = Date.parse('2012-08-13')

    all_days = (@first_day..@last_day).to_a
    sent_days = Message.all.map { |m| m.time_cst.to_date }
    @unsent_days = all_days - sent_days

    @messages = Message.where(['time >= ? and time <= ?', @day.to_time.beginning_of_day, @day.to_time.end_of_day])

    respond_with @messages
  end

  def show
    @last_day = Message.last.time_cst.to_date
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @first_day = Date.parse('2012-08-13')

    all_days = (@first_day..@last_day).to_a
    sent_days = Message.all.map { |m| m.time_cst.to_date }
    @unsent_days = all_days - sent_days

    @message = Message.find(params[:id])

    respond_to do |format|
      format.html
      format.pdf { render :text => PDFKit.new( message_url(@message) ).to_pdf }
    end
  end

  def search
    if params[:q]
      @hide_pagination = true
      @last_day = Message.last.time_cst.to_date
      @query = params[:q]
      @messages = Message.search(params)
      respond_with @messages
    else
      redirect_to :root
    end
  end

  def feed
    @title = 'J K Messages'
    @messages = Message.limit(20)

    @updated = @messages.first.time_cst unless @messages.empty?

    respond_to do |format|
      format.atom { render :layout => false }
    end
  end

end
