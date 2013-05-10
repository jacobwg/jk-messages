class Message < ActiveRecord::Base
  attr_accessible :body, :facebook_id, :local_id, :sender, :time

  paginates_per 10

  default_scope order('time ASC')

  # Search
  include Tire::Model::Search
  include Tire::Model::Callbacks
  mapping do
    indexes :id, :index => :not_analyzed
    indexes :body, :analyzer => 'snowball'
    indexes :time, :type => 'date'
    indexes :facebook_id, :index => :not_analyzed
    indexes :local_id, :index => :not_analyzed
    indexes :sender, :index => :not_analyzed
  end

  def self.search(params)
    tire.search(load: true, page: (params[:page] || 1)) do
      query { string params[:q] } #if params[:q].present?
      sort { by :time, 'desc' }
    end
  end

  def time_cst
    time.in_time_zone('America/Chicago')
  end

  def recipient
    sender == 'Jacob Gillespie' ? 'Kathryn Elizabeth' : 'Jacob Gillespie'
  end

  def date_formatted
    time_cst.strftime('%B %e, %Y - %l:%M %P')
  end

  def self.import
    thread_id = '510521608973600'
    access_token = User.where(uid: '100000505263000').first.token

    g = Koala::Facebook::API.new(access_token)

    fql = 'SELECT message_count FROM thread WHERE thread_id=510521608973600'
    message_count = FbGraph::Query.new(fql).fetch(access_token).first['message_count']

    (1...message_count).each do |i|
      next unless Message.where(:local_id => i).empty?
      puts "Fetching message #{i}"
      message = g.get_object("#{thread_id}_#{i}")
      puts message
      next if message['message'].nil?
      time = DateTime.parse(message['created_time']).in_time_zone('America/Chicago')
      message = Message.new(:facebook_id => message['id'], :local_id => i, :sender => message['from']['name'], :body => message['message'], :time => time)
      message.save
    end
  end

end
